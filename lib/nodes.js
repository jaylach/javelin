"use strict";

// The 'nodes.js' file contains all the nodes for building out our
// abstract syntax tree. This tree is then used to codeStartd the 
// kale script to the desired format (json, xml, etc)

var _ = require('lodash');

// -----
//  BaseNode
// -----

// BaseNode()
var BaseNode = function BaseNode(type) {
  this.type = type;
}; //- BaseNode()

// -----
//  AccessorNode
// -----

// AccessorNode()
var AccessorNode = function AccessorNode(base, properties) {
  BaseNode.call(this, 'ACCESSOR');

  this.base = base;
  this.properties = properties || [];
}; //- AccessorNode()

// codeStart()
AccessorNode.prototype.codeStart = function codeStart() {
  var accessor = this.base.codeStart();

  if ( this.properties != null ) {
    var propLength = this.properties.length;
    for ( var i = 0; i <= propLength - 1; i++ ) {
      accessor += this.properties[i].codeStart(false);
    }
  }

  return accessor;
}; //- codeStart()

// addProperty()
AccessorNode.prototype.addProperty = function addProperty(property) {
  this.properties = this.properties.concat(property);
}; //- addProperty()

// getOutKey()
AccessorNode.prototype.getOutKey = function getOutKey() {
  if ( this.attributes != null && this.attributes.key != null ) {
    return this.attributes.key;
  }

  return this.base.value;
}; //- getOutKey()

// -----
//  AttributeNode
// -----

// AttributeNode()
var AttributeNode = function AttributeNode(key, value) {
  this[key] = value;
}; //- AttributeNode()

// addAttribute()
AttributeNode.prototype.addAttribute = function addAttribute(attribute) {
  _.assign(this, attribute);
}; //- addAttribute()

// -----
//  CommentNode
// -----

// CommentNode()
var CommentNode = function CommentNode(value) {
  BaseNode.call(this, 'COMMENT');

  this.value = value;
}; //- CommentNode()

// codeStart()
CommentNode.prototype.codeStart = function codeStart() {
  return '';
}; //- codeStart()

// -----
//  ConditionBlockNode
// -----

// ConditionBlockNode()
var ConditionBlockNode = function ConditionBlockNode(condition, expression, body) {
  BaseNode.call(this, 'CONDITION');

  this.condition = condition;
  this.expression = expression;
  this.body = body;
}; //- ConditionBlockNode()

// codeStart()
ConditionBlockNode.prototype.codeStart = function codeStart() {
  var exprPart = '';
  if ( this.expression != null ) {
    exprPart = '(' + this.expression.codeStart() + ')';
  }

  return this.condition + exprPart + '{';
}; //- codeStart()  

// codeEnd()
ConditionBlockNode.prototype.codeEnd = function codeEnd() {
  return '}';
}; //- codeEnd()

// -----
//  CustomPropertyNode
// -----

// CustomPropertyNode()
var CustomPropertyNode = function CustomPropertyNode(value, body) {
  BaseNode.call(this, 'CUSTOM_PROPERTY');

  this.value = value;
  this.body = body || []; 
}; //- CustomPropertyNode()

// codeStart()
CustomPropertyNode.prototype.codeStart = function codeStart() {
  this.__variableName = _.uniqueId('$$');
  return 'var ' + this.__variableName + ' = (function() {';
}; //- codeStart()

// codeEnd()
CustomPropertyNode.prototype.codeEnd = function codeEnd() {
  return '}).call(this);' +
         '$$formatter.addProperty("' + this.value + '", ' + this.__variableName + ');';
}; //- codeEnd()

// -----
//  IdentifierNode
// -----

// IdentifierNode()
var IdentifierNode = function IdentifierNode(value, useBase) {
  BaseNode.call(this, 'IDENTIFIER');

  this.useBase = useBase;
  this.value = value;
}; //- IdentifierNode()

// codeStart()
IdentifierNode.prototype.codeStart = function codeStart(useBase) {
  var base = '';
  if ( useBase !== false && this.useBase !== false ) {
    base = 'this';
    if ( this.isGlobal === true ) {
      base = '$$global';
    }
  }

  return base + '["' + this.value + '"]';
}; //- codeStart()

// -----
//  LiteralNode
// -----

// LiteralNode()
var LiteralNode = function LiteralNode(value) {
  BaseNode.call(this, 'LITERAL');

  this.value = value;
}; //- LiteralNode()

// codeStart()
LiteralNode.prototype.codeStart = function codeStart() {
  return this.value;
}; //- codeStart()

// -----
//  NodeBlockNode
// -----

// NodeBlockNode()
var NodeBlockNode = function NodeBlockNode(type, source, value, body) {
  BaseNode.call(this, type.toUpperCase());

  this.isBlock = true;

  this.source = source;
  this.value = value;
  this.body = body;
}; //- NodeBlockNode()

// codeStart()
NodeBlockNode.prototype.codeStart = function codeStart() {
  var addType = this.type.substr(0, 1) + this.type.substr(1).toLowerCase();
  var addFunction = 'add' + addType + 'Block';

  return '$$formatter.' + addFunction + '("' + this.value + '", (function() {';
}; //- codeStart()

// codeEnd()
NodeBlockNode.prototype.codeEnd = function codeEnd() {
  return '}).bind(' + this.source.codeStart() + '));'
}; //- codeEnd()

// -----
//  OperationNode
// -----

// OperationNode()
var OperationNode = function OperationNode(op, left, right) {
  BaseNode.call(this, 'OPERATION');

  this.operator = op;
  this.left = left;
  this.right = right;
}; //- OperationNode()

// codeStart()
OperationNode.prototype.codeStart = function codeStart() {
  var rightPart = this.right.codeStart();
  if ( this.right.wrapped === true ) {
    rightPart = '(' + rightPart + ')';
  }

  if ( this.left != null ) {
    var leftPart = this.left.codeStart();
    if ( this.left.wrapped === true ) {
      leftPart = '(' + leftPart + ')';
    }
    return leftPart + this.operator + rightPart;  
  }
  else {
    // Negation
    return this.operator + rightPart;
  }
}; //- codeStart()

// -----
//  PropertyNode
// -----

// PropertyNode()
var PropertyNode = function PropertyNode(type, source, value) {
  BaseNode.call(this, 'PROPERTY');

  this.source = source;
  this.value = value;
}; //- PropertyNode()

// codeStart()
PropertyNode.prototype.codeStart = function codeStart() {
  return '$$formatter.addProperty("' + this.value + '", ' + this.source.codeStart() + ');';
}; //- codeStart()

// -----
//  ReturnNode
// -----

// ReturnNode()
var ReturnNode = function ReturnNode(expression) {
  BaseNode.call(this, 'RETURN');

  this.expression = expression;
}; //- ReturnNode()

// codeStart()
ReturnNode.prototype.codeStart = function codeStart() {
  return 'return ' + this.expression.codeStart() + ';';
}; //- codeStart()

// -----
//  TemplateNode
// -----

// TemplateNode()
var TemplateNode = function TemplateNode(body) {
  BaseNode.call(this, 'TEMPLATE');

  this.body = body;
}; //- TemplateNode()

// codeStart()
TemplateNode.prototype.codeStart = function codeStart() {
  return 'var $$global = this;';
}; //- codeStart()

// -----
//  Exports
// -----
module.exports = {
  Base: BaseNode,
  Accessor: AccessorNode,
  Attribute: AttributeNode,
  Comment: CommentNode,
  ConditionBlock: ConditionBlockNode,
  CustomProperty: CustomPropertyNode,
  Identifier: IdentifierNode,
  Literal: LiteralNode,
  NodeBlock: NodeBlockNode,
  Operation: OperationNode,
  Property: PropertyNode,
  Return: ReturnNode,
  Template: TemplateNode
};