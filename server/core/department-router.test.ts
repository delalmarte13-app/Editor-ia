import test from 'node:test';
import assert from 'node:assert/strict';
import { departmentForAgent, departmentForTask, isCreativeDepartment } from './department-router.js';

test('routes internal agents to editorial departments', () => {
  assert.equal(departmentForAgent('analyst'), 'director');
  assert.equal(departmentForAgent('rewriter'), 'narrative');
  assert.equal(departmentForAgent('critic'), 'editor');
  assert.equal(departmentForAgent('corrector'), 'editor');
  assert.equal(departmentForAgent('qa'), 'continuity');
  assert.equal(departmentForAgent('unknown'), undefined);
});

test('explicit task department overrides legacy agent routing', () => {
  assert.equal(departmentForTask({ agent: 'rewriter', department: 'director' }), 'director');
  assert.equal(departmentForTask({ agent: 'rewriter' }), 'narrative');
});

test('identifies creative departments', () => {
  assert.equal(isCreativeDepartment('narrative'), true);
  assert.equal(isCreativeDepartment('art'), true);
  assert.equal(isCreativeDepartment('editor'), false);
});
