#!/usr/bin/env python
import os
import sqlite3
from json import dumps
from flask import Flask, g, Response, request, render_template

from neo4j import GraphDatabase, basic_auth


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SQLITE_DATABASE = f"{BASE_DIR}/settings.db"

app = Flask(__name__, static_url_path='/static/')


def get_sqlite():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(SQLITE_DATABASE)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def init_sqlite():
    if not os.path.exists(SQLITE_DATABASE):
        with app.app_context():
            db = get_sqlite()
            with app.open_resource(f"{BASE_DIR}/schema.sql", mode='r') as f:
                db.cursor().executescript(f.read())
            db.commit()


def query_sqlite(query, args=()):
    cur = get_sqlite().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    names = [description[0] for description in cur.description]
    for r in rv:
        yield dict(zip(names, r))


def query_row(query, args=()):
    row = None
    for row in query_sqlite(query, args):
        break
    return row


def get_credentials():
    return query_row("SELECT * from credentials WHERE id=1")

def get_neo4j():
    if not hasattr(g, 'neo4j_db'):
        credentials = get_credentials()
        driver = GraphDatabase.driver(credentials['uri'], auth=basic_auth(credentials['username'], credentials['password']))
        g.neo4j_db = driver.session(database=credentials['db'])
    return g.neo4j_db


@app.teardown_appcontext
def close_neo4j(error):
    if hasattr(g, 'neo4j_db'):
        g.neo4j_db.close()


@app.route("/")
def get_index():
    # return app.send_static_file('index.html')
    return render_template("index.html", **get_credentials())


def serialize_movie(movie):
    return {
        'id': movie['id'],
        'title': movie['title'],
        'summary': movie['summary'],
        'released': movie['released'],
        'duration': movie['duration'],
        'rated': movie['rated'],
        'tagline': movie['tagline']
    }


def serialize_cast(cast):
    return {
        'name': cast[0],
        'job': cast[1],
        'role': cast[2]
    }


@app.route("/credentials", methods=['POST'])
def apply_credentials():
    missing_args = {'uri', 'username', 'password', 'db'} - set(request.values.keys())
    if len(missing_args) > 0:
        return Response(dumps({"missing args": list(missing_args)}),
                 mimetype="application/json", status=500)
    credentials = request.values
    db = get_sqlite()
    db.execute(
        "UPDATE credentials SET uri=?, username=?, password=?, db=? WHERE id=1", (
            credentials['uri'],
            credentials['username'],
            credentials['password'],
            credentials['db']
        )
    )
    db.commit()
    return Response(dumps({"status": "saved"}),
             mimetype="application/json")


@app.route("/graph")
def get_graph():
    db = get_neo4j()
    results = db.run("MATCH (m:Movie)<-[:ACTED_IN]-(a:Person) "
                     "RETURN m.title as movie, collect(a.name) as cast "
                     "LIMIT $limit", {"limit": request.args.get("limit", 100)})
    nodes = []
    rels = []
    i = 0
    for record in results:
        nodes.append({"title": record["movie"], "label": "movie"})
        target = i
        i += 1
        for name in record['cast']:
            actor = {"title": name, "label": "actor"}
            try:
                source = nodes.index(actor)
            except ValueError:
                nodes.append(actor)
                source = i
                i += 1
            rels.append({"source": source, "target": target})
    return Response(dumps({"nodes": nodes, "links": rels}),
                    mimetype="application/json")


@app.route("/search")
def get_search():
    try:
        q = request.args["q"]
    except KeyError:
        return []
    else:
        db = get_neo4j()
        results = db.run("MATCH (movie:Movie) "
                         "WHERE movie.title =~ $title "
                         "RETURN movie", {"title": "(?i).*" + q + ".*"}
                         )
        return Response(dumps([serialize_movie(record['movie']) for record in results]),
                        mimetype="application/json")


@app.route("/movie/<title>")
def get_movie(title):
    db = get_neo4j()
    results = db.run("MATCH (movie:Movie {title:$title}) "
                     "OPTIONAL MATCH (movie)<-[r]-(person:Person) "
                     "RETURN movie.title as title,"
                     "collect([person.name, "
                     "         head(split(toLower(type(r)), '_')), r.roles]) as cast "
                     "LIMIT 1", {"title": title})

    result = results.single()
    return Response(dumps({"title": result['title'],
                           "cast": [serialize_cast(member)
                                    for member in result['cast']]}),
                    mimetype="application/json")


if __name__ == '__main__':
    init_sqlite()

    port = os.getenv("PORT", 8080)
    app.run(port=port)
