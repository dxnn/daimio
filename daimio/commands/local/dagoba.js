// The dagoba interface model

D.import_models({
  dagoba: {
    desc: "Some dagobay commands",
    vars: {},
    methods: {

      // ADDING THINGS

      add_graph: {
        desc: "Create a new graph",
        params: [
          {
            key: 'id',
            desc: "The graph id",
            type: 'string',
          },
        ],
        fun: function(id) {
          var graph = Dagoba.new_graph(id);

          // add graph action bindings
          topics = ['node/add','node/remove','port/add','port/remove','edge/add','edge/remove'];
          for(var i=0, l=topics.length; i < l; i++) {
            D.Etc.dagoba.set_actions(graph, topics[i]);
          }

          return graph.id;
        },
      },

      // TODO: allow adding conditions to a graph through this handler (since they're not synced via var bindings like actions are)

      add_node: {
        desc: "Add a node to a graph",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The node id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional node data",
            type: 'list',
          },
        ],
        fun: function(graph, id, data) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          data = data || {};
          data.id = id;

          var node = graph.add_node(data);
          return node ? node.id : false;
        },
      },

      add_port: {
        desc: "Add a port to a node",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'node',
            desc: "The node id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The port id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional port data",
            type: 'list',
          },
        ],
        fun: function(graph, node, id, data) {
          // THINK: is there a way to not have to require both graph and node?

          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          node = graph.nodes[node];
          if(!node) return D.on_error('Invalid node id');

          data = data || {};
          data.id = id;

          var port = graph.add_port(node, data);
          return port ? port.id : false;
        },
      },

      add_edge: {
        desc: "Add an edge between two ports",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'startport',
            desc: "The starting port id",
            type: 'string',
            required: true,
          },
          {
            key: 'endport',
            desc: "The ending port id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The port id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional port data",
            type: 'list',
          },
        ],
        fun: function(graph, startport, endport, id, data) {
          // THINK: is there a way to not have to require both graph and ports?

          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          startport = graph.ports[startport];
          if(!startport) return D.on_error('Invalid startport id');

          endport = graph.ports[endport];
          if(!endport) return D.on_error('Invalid endport id');

          data = data || {};
          data.id = id;

          var edge = graph.add_edge(startport, endport, data);
          return edge ? edge.id : false;
        },
      },

      // FINDING THINGS

      find_nodes: {
        desc: "Find a set of nodes",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by_ids',
            desc: "Some node ids",
            type: 'list',
          },
        ],
        fun: function(graph, by_ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          var node, nodes = {};

          if(!by_ids.length) return D.Etc.dagoba.scrubber(graph.nodes);

          for(var i=0, l=by_ids.length; i < l; i++) {
            node = graph.nodes[by_ids[i]];
            if(node) nodes[node.id] = node;
          }

          return D.Etc.dagoba.scrubber(nodes);
        },
      },

      find_ports: {
        desc: "Find a set of ports",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by_ids',
            desc: "Some port ids",
            type: 'list',
          },
        ],
        fun: function(graph, by_ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          var port, ports = {};

          if(!by_ids.length) return D.Etc.dagoba.scrubber(graph.ports);

          for(var i=0, l=by_ids.length; i < l; i++) {
            port = graph.ports[by_ids[i]];
            if(port) ports[port.id] = port;
          }

          return D.Etc.dagoba.scrubber(ports);
        },
      },

      find_edges: {
        desc: "Find a set of edges",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by_ids',
            desc: "Some edge ids",
            type: 'list',
          },
        ],
        fun: function(graph, by_ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          var edge, edges = {};

          if(!by_ids.length) return D.Etc.dagoba.scrubber(graph.edges);

          for(var i=0, l=by_ids.length; i < l; i++) {
            edge = graph.edges[by_ids[i]];
            if(edge) edges[edge.id] = edge;
          }

          return D.Etc.dagoba.scrubber(edges);
        },
      },

      // SORTER

      sort_nodes: {
        desc: "Get a sorted set of nodes",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by',
            desc: "A sort function id",
            type: 'string',
            fallback: 'natural',
          },
          {
            key: 'options',
            desc: "Some options for the sort function",
            type: 'list',
          },
        ],
        fun: function(graph, by, options) {
          // TODO: allow 'by' to be a block, which is used to sort the nodes (-1, 0, 1 and ... 'x' (for remove))

          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          var sorter = Dagoba.sort[by];
          if(!sorter) {
            D.on_error('Invalid sort function id, falling back to natural');
            sorter = Dagoba.sort['natural'];
          }

          return D.Etc.dagoba.scrubber(sorter(graph, options));
        },
      },

      // REMOVING THINGS

      remove_nodes: {
        desc: "Remove some nodes",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'ids',
            desc: "Node ids",
            type: 'list',
            required: true,
          },
        ],
        fun: function(graph, ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          var node;

          for(var i=0, l=ids.length; i < l; i++) {
            node = graph.nodes[ids[i]];
            if(node) node.remove();
          }

          return graph.id;
        },
      },

      remove_ports: {
        desc: "Remove some ports",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'ids',
            desc: "Port ids",
            type: 'list',
            required: true,
          },
        ],
        fun: function(graph, ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          var port;

          for(var i=0, l=ids.length; i < l; i++) {
            port = graph.ports[ids[i]];
            if(port) port.remove();
          }

          return graph.id;
        },
      },

      remove_edges: {
        desc: "Remove some edges",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'ids',
            desc: "Edge ids",
            type: 'list',
            required: true,
          },
        ],
        fun: function(graph, ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          var edge;

          for(var i=0, l=ids.length; i < l; i++) {
            edge = graph.edges[ids[i]];
            if(edge) edge.remove();
          }

          return graph.id;
        },
      },

      // METADATA

      set_data: {
        desc: "Set a piece of data in the thing",
        help: "The path can't start with a restricted key value. Existing references in Daimio variables are unaffected, so you'll need to e.g. {dagoba find_nodes} again.",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
          {
            key: 'type',
            desc: "Accepts: nodes, paths, or edges",
            type: 'string',
            required: true,
          },
          {
            key: 'path',
            desc: "A dot-delimited variable path",
            type: 'string',
            required: true,
          },
          {
            key: 'value',
            desc: "Some kind of value",
            type: 'anything'
          },
        ],
        fun: function(graph, id, type, path, value) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');

          if(['nodes', 'paths', 'edges'].indexOf(type) == -1) return D.on_error('Invalid type');

          var thing = graph[type][id];
          if(!thing) D.on_error('Invalid id');

          // TODO: scrub bad paths, like 'startport'

          // maybe instead D.recursive_extend(thing, path.split('.'), value);
          // D.recursive_insert(thing, path.split('.'), value);

          return graph.id;
        },
      },


    }
  }
});

D.Etc.dagoba = {};
D.Etc.dagoba.scrubber = function(things) {
  var ports = {}, edges = {}, clean_things = [],
      id_keys = ['ports', 'edges', 'startnodes', 'endnodes', 'startnode', 'endnode', 'startports', 'endports', 'startport', 'endport', 'startedges', 'endedges', 'node'],
      bad_keys = ['graph', 'init', 'remove'];

  for(var thing_key in things) {
    var clean_thing = {}, thing = things[thing_key];

    for(var key in thing) {
      if(id_keys.indexOf(key) != -1) {
        clean_thing[key] = D.Etc.dagoba.extract_ids(thing[key]);
      }
      else if(bad_keys.indexOf(key) == -1) { // (not) born under a bad key
        if(D.is_block(thing[key])) {
          clean_thing[key] = thing[key];
        } else {
          clean_thing[key] = D.scrub_var(thing[key]);
        }
      }
    }

    clean_things.push(clean_thing);
  }

  return clean_things;
};

D.Etc.dagoba.extract_ids = function(things) {
  var ids = [];
  if(things.id) return [things.id];

  for(var key in things) {
    ids.push(things[key].id);
  }

  return ids;
}

D.Etc.dagoba.set_actions = function(graph, topic) {
  graph.add_action(topic, function(topic) {
    return function(thing) {
      // D.execute('variable', 'set', [topic, thing]);
    };
  }('DAGOBA' + topic.replace('/', '_')));
}

// TODO: this won't work on the server
if((typeof window !== 'undefined') && window.Dagoba) {
  Dagoba.onerror = D.on_error;
}
