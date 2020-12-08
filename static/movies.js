'use strict'

$(function () {
    function showMovie(title) {
        $.get("/movie/" + encodeURIComponent(title),
                function (data) {
                    if (!data) return;
                    $("#title").text(data.title);
                    $("#poster").attr("src","https://neo4j-documentation.github.io/developer-resources/language-guides/assets/posters/"+encodeURIComponent(data.title)+".jpg");
                    const $list = $("#crew").empty();
                    data.cast.forEach(function (cast) {
                        $list.append($("<li>" + cast.name + " " +cast.job + (cast.job == "acted"?" as " + cast.role : "") + "</li>"));
                    });
                }, "json");
        return false;
    }
    function search() {
        const query=$("#search").find("input[name=search]").val();
        $.get("/search?q=" + encodeURIComponent(query),
                function (data) {
                    const t = $("table#results tbody").empty();
                    if (!data || data.length == 0) return;
                    data.forEach(function (movie) {
                        $("<tr><td class='movie'>" + movie.title + "</td><td>" + movie.released + "</td><td>" + movie.tagline + "</td></tr>").appendTo(t)
                                .click(function() { showMovie($(this).find("td.movie").text());})
                    });
                    showMovie(data[0].title);
                }, "json");
        return false;
    }

    $("#search").submit(search);
    search();
})
