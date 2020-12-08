const width = 800, height = 800;

const force = d3.layout.force()
        .charge(-200).linkDistance(30).size([width, height]);

const svg = d3.select("#graph").append("svg")
        .attr("width", "100%").attr("height", "100%")
        .attr("pointer-events", "all");

d3.json("/graph", function(error, graph) {
    if (error) return;

    /**
        graph.nodes:
        0: {title: "The Matrix", label: "movie"}
        1: {title: "Emil Eifrem", label: "actor"}
        2: {title: "Hugo Weaving", label: "actor"}
        3: {title: "Laurence Fishburne", label: "actor"}
        4: {title: "Carrie-Anne Moss", label: "actor"}
        5: {title: "Keanu Reeves", label: "actor"}
        6: {title: "The Matrix Reloaded", label: "movie"}
     */

    /**
        graph.links
        0: {source: 1, target: 0}
        1: {source: 2, target: 0}
        2: {source: 3, target: 0}
        3: {source: 4, target: 0}
        4: {source: 5, target: 0}
        5: {source: 2, target: 6}
        6: {source: 3, target: 6}
        7: {source: 4, target: 6}
        8: {source: 5, target: 6}
     */

    force.nodes(graph.nodes).links(graph.links).start();

    const link = svg.selectAll(".link")
            .data(graph.links).enter()
            .append("line").attr("class", "link");

    const node = svg.selectAll(".node")
            .data(graph.nodes).enter()
            .append("circle")
            .attr("class", function (d) { return "node "+d.label })
            .attr("r", 10)
            .call(force.drag);

    // html title attribute
    node.append("title")
            .text(function (d) { return d.title; })

    // force feed algo ticks
    force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

        node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
    });
});
