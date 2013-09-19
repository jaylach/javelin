var assert = require('assert-plus');
var _ = require('underscore');

// -----
//  Context
// -----

// Context()
var Context = function Context(data) {
  var keys = _.keys(data);

  var context = {};
  _.each(keys, function(key) {
    context[key] = data[key];
  });

  return context; 
}; //- Context()

// get()
Context.get = function(node, data, globals) {
  assert.object(node, 'node');
  assert.object(data, 'data');
  assert.object(globals, 'globals');

  var context = {};

  if ( globals != null ) {
    context.global = globals;
  }

  // Set our configuration
  var configs = _.where(node.body, { type: 'CONFIG' });
  context.config = _.reduce(configs, function(obj, cfg) {
    if ( node.type === 'ARRAY' ) {
      if ( cfg.config === 'named' ) {
        throw new Error('Array types must be named!');
      }
    }

    obj[cfg.config] = cfg.value;
    return obj;
  }, {});

  // Set our "this" scope
  if ( node.source != null ) {
    var nodeCtx = node.context || 'THIS';
    if ( nodeCtx === 'GLOBAL' ) {
      // Copy properties from global to here
      context.this = new Context(globals[node.source]);
    }
    else if ( nodeCtx === 'THIS' ) {
      if ( node.type === 'PROPERTY' ) {
        context.this = new Context(data);
      }
      else {
        context.this = new Context(data[node.source]);
      }
    }
  } 
  else {
    context.this = new Context(data);
  }

  return context;
}; //- get()

// -----
//  Helpers
// -----

// walkNode()
var walkNode = function walkNode(builder, node, context, root) {
  if ( builder.shouldBuild(node.type) ) {
    var context = Context.get(node, context.this || {}, context.global || {});
    var newRoot = builder.buildNode(node, context, root);

    _.each(node.body, function(item) {
      item.parentType = node.type;
      walkNode(builder, item, context, newRoot);
    });
  }
}; //- walkNode()

// -----
//  Compiler
// -----

// Compiler
var Compiler = function Compiler(ast, builder) {
  return function compile(data, justAst) {
    if ( justAst === true ) return JSON.stringify(ast);

    var globals = new Context(data);

    var context = {
      global: globals
    };

    var root = builder.buildNode(ast, context);

    _.each(ast.body, function(node) {
      node.parentType = root.type;
      walkNode(builder, node, context, root);
    });

    return root;
  };
}; //- Compiler()

// Exports
module.exports = Compiler;