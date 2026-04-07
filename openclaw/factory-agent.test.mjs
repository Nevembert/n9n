import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyEdits,
  createMermaid,
  createWorkspaceSkeleton,
  ensureFactoryAgent,
  rebuildGraph,
  validateWorkspace
} from './factory-agent.mjs';

test('createWorkspaceSkeleton creates factory agent workspace', () => {
  const workspace = createWorkspaceSkeleton({
    name: 'OpenClaw Lab',
    goal: 'Automate OpenClaw lifecycle'
  });

  assert.equal(workspace.workspace.factoryAgentId, 'factory-agent-1');
  assert.equal(workspace.agents[0].id, 'factory-agent-1');
  assert.match(workspace.workspace.id, /^openclaw-/);
  assert.equal(workspace.graph.nodes.includes('A_factory_agent_1'), true);
});

test('ensureFactoryAgent injects missing factory agent', () => {
  const workspace = createWorkspaceSkeleton({
    name: 'OpenClaw Lab',
    goal: 'Automate OpenClaw lifecycle'
  });

  const withoutFactory = {
    ...workspace,
    agents: []
  };

  const patched = ensureFactoryAgent(withoutFactory);
  assert.equal(patched.agents[0].id, workspace.workspace.factoryAgentId);
});

test('applyEdits upserts and patches workspace content', () => {
  const workspace = createWorkspaceSkeleton({
    name: 'OpenClaw Lab',
    goal: 'Automate OpenClaw lifecycle'
  });

  const updated = applyEdits(workspace, [
    {
      op: 'upsert',
      entity: 'tasks',
      item: {
        id: 'task-2',
        title: 'Wire memory visualizer',
        status: 'queued',
        ownerAgentId: 'factory-agent-1'
      }
    },
    {
      op: 'patchWorkspace',
      patch: {
        goal: 'Automate and visualize OpenClaw memory'
      }
    }
  ]);

  assert.equal(updated.tasks.some((task) => task.id === 'task-2'), true);
  assert.equal(updated.workspace.goal, 'Automate and visualize OpenClaw memory');
  assert.equal(updated.graph.nodes.includes('T_task_2'), true);
});

test('removeConnection removes only exact connection', () => {
  const workspace = createWorkspaceSkeleton({
    name: 'OpenClaw Lab',
    goal: 'Automate OpenClaw lifecycle'
  });

  const withExtra = applyEdits(workspace, [
    {
      op: 'upsert',
      entity: 'connections',
      item: {
        source: 'agent:factory-agent-1',
        target: 'datastore:workspace-graph-db',
        kind: 'indexes_memory'
      }
    }
  ]);

  const removed = applyEdits(withExtra, [
    {
      op: 'removeConnection',
      source: 'agent:factory-agent-1',
      target: 'datastore:workspace-graph-db',
      kind: 'indexes_memory'
    }
  ]);

  assert.equal(removed.connections.some((connection) => connection.kind === 'indexes_memory'), false);
  assert.equal(removed.connections.some((connection) => connection.kind === 'reads_writes'), true);
});

test('validateWorkspace fails for broken references', () => {
  const workspace = createWorkspaceSkeleton({
    name: 'OpenClaw Lab',
    goal: 'Automate OpenClaw lifecycle'
  });

  const broken = rebuildGraph({
    ...workspace,
    tasks: [
      {
        id: 'task-bad',
        title: 'Broken task',
        status: 'queued',
        ownerAgentId: 'missing-agent'
      }
    ]
  });

  assert.throws(() => validateWorkspace(broken), /missing ownerAgentId/);
});

test('createMermaid contains task and datastore links', () => {
  const workspace = createWorkspaceSkeleton({
    name: 'OpenClaw Lab',
    goal: 'Automate OpenClaw lifecycle'
  });

  const diagram = createMermaid(workspace);
  assert.match(diagram, /graph TD/);
  assert.match(diagram, /persists/);
  assert.match(diagram, /owns/);
});
