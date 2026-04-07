#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * @typedef {{ id:string, name:string, goal:string, factoryAgentId:string, metadata?: Record<string, unknown> }} WorkspaceMeta
 * @typedef {{ id:string, name:string, role:string, model:string, skills:string[], memory:{ shortTerm:string, longTerm:string } }} Agent
 * @typedef {{ id:string, title:string, status:'queued'|'running'|'blocked'|'done', ownerAgentId:string, dependsOn?:string[] }} Task
 * @typedef {{ id:string, agentId:string, kind:'short_term'|'long_term'|'episodic'|'semantic', summary:string }} MemoryRecord
 * @typedef {{ id:string, name:string, description:string }} Skill
 * @typedef {{ id:string, engine:string, purpose:string }} Datastore
 * @typedef {{ source:string, target:string, kind:string }} Connection
 * @typedef {{ workspace: WorkspaceMeta, agents: Agent[], graph:{ nodes:string[], edges:{from:string,to:string,label:string}[] }, memory:MemoryRecord[], tasks:Task[], skills:Skill[], datastores:Datastore[], connections:Connection[] }} OpenClawWorkspace
 * @typedef {{ op:'upsert', entity:'agents'|'tasks'|'memory'|'skills'|'datastores'|'connections', item: Record<string, unknown> } | { op:'remove', entity:'agents'|'tasks'|'memory'|'skills'|'datastores', id:string } | { op:'removeConnection', source:string, target:string, kind:string } | { op:'patchWorkspace', patch: Partial<WorkspaceMeta> }} WorkspaceEdit
 */

const nowIso = () => new Date().toISOString();

/** @param {OpenClawWorkspace} workspace */
export function createMermaid(workspace) {
  const lines = ['graph TD'];

  lines.push(`  W[${escapeMermaid(workspace.workspace.name)}]`);
  for (const agent of workspace.agents) {
    const agentNode = `A_${normalizeId(agent.id)}`;
    lines.push(`  ${agentNode}[${escapeMermaid(agent.name)}]`);
    lines.push(`  W -->|contains| ${agentNode}`);
  }

  for (const task of workspace.tasks) {
    const taskNode = `T_${normalizeId(task.id)}`;
    lines.push(`  ${taskNode}(${escapeMermaid(task.title)})`);
    lines.push(`  A_${normalizeId(task.ownerAgentId)} -->|owns| ${taskNode}`);
    for (const dep of task.dependsOn ?? []) {
      lines.push(`  T_${normalizeId(dep)} -->|blocks| ${taskNode}`);
    }
  }

  for (const memory of workspace.memory) {
    const memoryNode = `M_${normalizeId(memory.id)}`;
    lines.push(`  ${memoryNode}[${escapeMermaid(`${memory.kind}: ${memory.summary}`)}]`);
    lines.push(`  A_${normalizeId(memory.agentId)} -->|remembers| ${memoryNode}`);
  }

  for (const datastore of workspace.datastores) {
    const dbNode = `D_${normalizeId(datastore.id)}`;
    lines.push(`  ${dbNode}[${escapeMermaid(`${datastore.engine} (${datastore.purpose})`)}]`);
    lines.push(`  W -->|persists| ${dbNode}`);
  }

  for (const edge of workspace.connections) {
    lines.push(`  ${normalizeNode(edge.source)} -->|${escapeMermaid(edge.kind)}| ${normalizeNode(edge.target)}`);
  }

  return `${lines.join('\n')}\n`;
}

function normalizeNode(id) {
  if (id.startsWith('A_') || id.startsWith('T_') || id.startsWith('M_') || id.startsWith('D_') || id === 'W') {
    return id;
  }

  if (id.startsWith('agent:')) return `A_${normalizeId(id.slice(6))}`;
  if (id.startsWith('task:')) return `T_${normalizeId(id.slice(5))}`;
  if (id.startsWith('memory:')) return `M_${normalizeId(id.slice(7))}`;
  if (id.startsWith('datastore:')) return `D_${normalizeId(id.slice(10))}`;
  return normalizeId(id);
}

function normalizeId(value) {
  return value.replace(/[^a-zA-Z0-9_]/g, '_');
}

function escapeMermaid(value) {
  return value.replace(/[\[\](){}|]/g, ' ').replace(/"/g, "'");
}

/** @param {OpenClawWorkspace} workspace */
export function ensureFactoryAgent(workspace) {
  const hasFactory = workspace.agents.some((agent) => agent.id === workspace.workspace.factoryAgentId);
  if (hasFactory) {
    return workspace;
  }

  return {
    ...workspace,
    agents: [
      {
        id: workspace.workspace.factoryAgentId,
        name: 'Factory Agent',
        role: 'workspace_orchestrator',
        model: 'gpt-5.3-codex',
        skills: ['workspace-edit', 'topology-sync', 'task-routing'],
        memory: {
          shortTerm: 'Tracks current edit batch',
          longTerm: 'Stores workspace topology conventions'
        }
      },
      ...workspace.agents
    ]
  };
}

/** @param {{name:string, goal:string}} input */
export function createWorkspaceSkeleton(input) {
  const workspaceId = `openclaw-${slugify(input.name)}`;
  const factoryId = 'factory-agent-1';

  /** @type {OpenClawWorkspace} */
  const workspace = {
    workspace: {
      id: workspaceId,
      name: input.name,
      goal: input.goal,
      factoryAgentId: factoryId,
      metadata: {
        createdAt: nowIso(),
        owner: 'openclaw',
        version: '0.3.0'
      }
    },
    agents: [
      {
        id: factoryId,
        name: 'Factory Agent',
        role: 'workspace_orchestrator',
        model: 'gpt-5.3-codex',
        skills: ['workspace-edit', 'task-synthesis', 'memory-layout'],
        memory: {
          shortTerm: 'Active change-set for workspace graph',
          longTerm: 'Reusable architecture patterns for OpenClaw workspaces'
        }
      }
    ],
    graph: {
      nodes: [],
      edges: []
    },
    memory: [
      {
        id: 'factory-memory-bootstrap',
        agentId: factoryId,
        kind: 'long_term',
        summary: 'Bootstrap architecture for OpenClaw automation workspaces'
      }
    ],
    tasks: [
      {
        id: 'task-bootstrap-map',
        title: 'Create initial OpenClaw workspace map',
        status: 'queued',
        ownerAgentId: factoryId
      }
    ],
    skills: [
      {
        id: 'workspace-edit',
        name: 'Workspace Edit',
        description: 'Applies declarative changes to OpenClaw workspace artifacts'
      },
      {
        id: 'memory-layout',
        name: 'Memory Layout',
        description: 'Maintains memory layers and retrieval policies'
      }
    ],
    datastores: [
      {
        id: 'workspace-graph-db',
        engine: 'postgresql+pgvector',
        purpose: 'Task graph, memory embeddings, and link indexes'
      }
    ],
    connections: [
      {
        source: `agent:${factoryId}`,
        target: 'datastore:workspace-graph-db',
        kind: 'reads_writes'
      }
    ]
  };

  return rebuildGraph(workspace);
}

/** @param {OpenClawWorkspace} workspace */
export function rebuildGraph(workspace) {
  const nodes = ['W'];
  const edges = [];

  for (const agent of workspace.agents) {
    const nodeId = `A_${normalizeId(agent.id)}`;
    nodes.push(nodeId);
    edges.push({ from: 'W', to: nodeId, label: 'contains' });
  }

  for (const task of workspace.tasks) {
    const taskNode = `T_${normalizeId(task.id)}`;
    nodes.push(taskNode);
    edges.push({ from: `A_${normalizeId(task.ownerAgentId)}`, to: taskNode, label: 'owns' });
    for (const dep of task.dependsOn ?? []) {
      edges.push({ from: `T_${normalizeId(dep)}`, to: taskNode, label: 'blocks' });
    }
  }

  for (const memory of workspace.memory) {
    const memoryNode = `M_${normalizeId(memory.id)}`;
    nodes.push(memoryNode);
    edges.push({ from: `A_${normalizeId(memory.agentId)}`, to: memoryNode, label: 'remembers' });
  }

  for (const datastore of workspace.datastores) {
    const dbNode = `D_${normalizeId(datastore.id)}`;
    nodes.push(dbNode);
    edges.push({ from: 'W', to: dbNode, label: 'persists' });
  }

  for (const connection of workspace.connections) {
    edges.push({
      from: normalizeNode(connection.source),
      to: normalizeNode(connection.target),
      label: connection.kind
    });
  }

  return {
    ...workspace,
    graph: {
      nodes: [...new Set(nodes)],
      edges
    }
  };
}

/** @param {OpenClawWorkspace} workspace @param {WorkspaceEdit[]} edits */
export function applyEdits(workspace, edits) {
  const updated = structuredClone(ensureFactoryAgent(workspace));

  for (const edit of edits) {
    if (edit.op === 'patchWorkspace') {
      updated.workspace = {
        ...updated.workspace,
        ...edit.patch,
        metadata: {
          ...(updated.workspace.metadata ?? {}),
          ...(edit.patch.metadata ?? {}),
          updatedAt: nowIso()
        }
      };
      continue;
    }

    if (edit.op === 'removeConnection') {
      updated.connections = updated.connections.filter(
        (connection) => !(connection.source === edit.source && connection.target === edit.target && connection.kind === edit.kind)
      );
      continue;
    }

    applyCollectionEdit(updated[edit.entity], edit);
  }

  if (!updated.workspace.metadata) {
    updated.workspace.metadata = { updatedAt: nowIso() };
  } else {
    updated.workspace.metadata.updatedAt = nowIso();
  }

  return rebuildGraph(ensureFactoryAgent(updated));
}

/** @template T extends Record<string, unknown>
 * @param {T[]} collection
 * @param {Extract<WorkspaceEdit, {op:'upsert'} | {op:'remove'}>} edit
 */
function applyCollectionEdit(collection, edit) {
  if (edit.op === 'remove') {
    const index = collection.findIndex((item) => String(item.id ?? '') === edit.id);
    if (index >= 0) {
      collection.splice(index, 1);
    }
    return;
  }

  const id = String(edit.item.id ?? '');
  if (!id && !('source' in edit.item && 'target' in edit.item && 'kind' in edit.item)) {
    throw new Error('Upsert item must include id (or source/target/kind for connections)');
  }

  if ('source' in edit.item && 'target' in edit.item && 'kind' in edit.item) {
    const connectionKey = `${edit.item.source}:${edit.item.target}:${edit.item.kind}`;
    const index = collection.findIndex((item) => `${item.source}:${item.target}:${item.kind}` === connectionKey);
    if (index >= 0) {
      collection[index] = { ...collection[index], ...edit.item };
      return;
    }
    collection.push(edit.item);
    return;
  }

  const index = collection.findIndex((item) => String(item.id ?? '') === id);
  if (index >= 0) {
    collection[index] = { ...collection[index], ...edit.item };
    return;
  }

  collection.push(edit.item);
}

/** @param {OpenClawWorkspace} workspace */
export function validateWorkspace(workspace) {
  const errors = [];

  if (!workspace.workspace?.factoryAgentId) {
    errors.push('workspace.factoryAgentId is required');
  }

  const agentIds = new Set(workspace.agents.map((agent) => agent.id));
  const taskIds = new Set(workspace.tasks.map((task) => task.id));

  if (!agentIds.has(workspace.workspace.factoryAgentId)) {
    errors.push(`factory agent "${workspace.workspace.factoryAgentId}" is missing in agents[]`);
  }

  for (const task of workspace.tasks) {
    if (!agentIds.has(task.ownerAgentId)) {
      errors.push(`task "${task.id}" references missing ownerAgentId "${task.ownerAgentId}"`);
    }

    for (const dependency of task.dependsOn ?? []) {
      if (!taskIds.has(dependency)) {
        errors.push(`task "${task.id}" has unknown dependency "${dependency}"`);
      }
    }
  }

  for (const memory of workspace.memory) {
    if (!agentIds.has(memory.agentId)) {
      errors.push(`memory "${memory.id}" references missing agentId "${memory.agentId}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Workspace validation failed:\n- ${errors.join('\n- ')}`);
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function runCli(argv = process.argv.slice(2)) {
  const [action = 'init', workspaceArg, ...rest] = argv;
  const workspacePath = workspaceArg
    ? path.resolve(process.cwd(), workspaceArg)
    : path.resolve(process.cwd(), 'openclaw.workspace.json');

  if (action === 'init') {
    const [name = 'OpenClaw Automation Workspace', goal = 'Automate OpenClaw agent workspace lifecycle'] = rest;
    const workspace = createWorkspaceSkeleton({ name, goal });
    await persistWorkspace(workspacePath, workspace);
    return;
  }

  if (action === 'visualize') {
    const workspace = rebuildGraph(ensureFactoryAgent(JSON.parse(await fs.readFile(workspacePath, 'utf8'))));
    validateWorkspace(workspace);
    await writeMermaid(workspacePath, workspace);
    return;
  }

  if (action === 'validate') {
    const workspace = rebuildGraph(ensureFactoryAgent(JSON.parse(await fs.readFile(workspacePath, 'utf8'))));
    validateWorkspace(workspace);
    console.log(`Workspace validation passed: ${workspacePath}`);
    return;
  }

  if (action === 'apply') {
    const editsPath = rest[0] ? path.resolve(process.cwd(), rest[0]) : '';
    if (!editsPath) {
      throw new Error('Missing edits file path. Usage: apply <workspace.json> <edits.json>');
    }

    const [workspaceRaw, editsRaw] = await Promise.all([fs.readFile(workspacePath, 'utf8'), fs.readFile(editsPath, 'utf8')]);

    const workspace = JSON.parse(workspaceRaw);
    const edits = JSON.parse(editsRaw);
    if (!Array.isArray(edits)) {
      throw new Error('Edits payload must be an array');
    }

    const updated = applyEdits(workspace, edits);
    await persistWorkspace(workspacePath, updated);
    return;
  }

  throw new Error('Unsupported action. Use one of: init, visualize, validate, apply');
}

/** @param {string} workspacePath @param {OpenClawWorkspace} workspace */
async function persistWorkspace(workspacePath, workspace) {
  const normalized = rebuildGraph(ensureFactoryAgent(workspace));
  validateWorkspace(normalized);
  await fs.mkdir(path.dirname(workspacePath), { recursive: true });
  await fs.writeFile(workspacePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  await writeMermaid(workspacePath, normalized);
  console.log(`Workspace written to ${workspacePath}`);
}

/** @param {string} workspacePath @param {OpenClawWorkspace} workspace */
async function writeMermaid(workspacePath, workspace) {
  const diagramPath = workspacePath.replace(/\.json$/i, '.mermaid');
  await fs.writeFile(diagramPath, createMermaid(workspace), 'utf8');
  console.log(`Mermaid diagram written to ${diagramPath}`);
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  runCli().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
