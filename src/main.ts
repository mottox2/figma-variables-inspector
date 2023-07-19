import { emit, on, showUI } from '@create-figma-plugin/utilities'
import { ResizeWindowHandler } from './types'

const getFullName = (node: SceneNode): string => {
  if (node.parent && node.parent.type !== 'PAGE' && node.parent.type !== 'DOCUMENT') {
    return getFullName(node.parent) + '/' + node.name
  }
  return node.name
}


export default function () {
  on<ResizeWindowHandler>(
    'RESIZE_WINDOW',
    function (windowSize: { width: number; height: number }) {
      const { width, height } = windowSize
      figma.ui.resize(width, height)
    }
  )

  figma.on(
    'selectionchange',
    async () => {
      const variables: Record<string, any> = {}
      const nodes: Record<string, any> = {}
      const collectVariables = (node: SceneNode) => {
        if ("children" in node) node.children.forEach(child => collectVariables(child));

        // console.log('[VariablesViewer]', node.boundVariables)
        if (node.boundVariables) {
          let useNode = false
          const processVariable = (alias: VariableAlias) => {
            console.log(alias.id)
            const variable = figma.variables.getVariableById(alias.id);
            if (!variable) return;
            // console.log(alias, alias.id, v);
            const { name, resolvedType, id, valuesByMode } = variable;
            const defaultValue = valuesByMode[Object.keys(valuesByMode)[0]];
            variables[id] = { name, resolvedType, id, defaultValue }
            useNode = true
          };
          const { fills, strokes, componentProperties = {}, ...otherVariables } = node.boundVariables
          fills?.forEach(processVariable)
          strokes?.forEach(processVariable)
          Object.entries(componentProperties).forEach(([_, alias]) => processVariable(alias))
          Object.entries(otherVariables).forEach(([_, alias]) => processVariable(alias))
          if (!useNode) return
          console.log(node)
          nodes[node.id] = {
            id: node.id,
            fullName: getFullName(node),
            name: node.name,
            type: node.type,
            variables: node.boundVariables,
            relatedActions: []
          }
        }

        // NOTE: 現状Set Variables, Conditionalのactionは取得できない
        // actionが取得できないreactionはこれらのアクションである可能性がある
        // TODO: 無料プランではここの処理をスキップしたい
        if (nodes[node.id] && "reactions" in node)
          node.reactions.forEach(reaction => {
            console.log('[VariablesViewer]', reaction)
            if (reaction.action) return
            nodes[node.id].relatedActions.push(reaction.trigger?.type)
          })
      };

      const selection = figma.currentPage.selection
      console.log(selection)
      selection.forEach(node => {
        collectVariables(node)
      })

      emit('COLLECT_VARIABLES', { variables, nodes });
    }
  );

  // 理想を言えば、selectionを変更する前のものを残してundoできるとめちゃ嬉しい。
  on('SELECT_NODE', (id) => {
    const node = figma.getNodeById(id)
    if (!node || node.type === 'PAGE' || node.type === 'DOCUMENT') return
    figma.currentPage.selection = [node]
  })

  showUI({
    height: 480,
    width: 320
  })
}
