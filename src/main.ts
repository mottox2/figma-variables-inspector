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

  const inspectVariables = () => {
    const variables: Record<string, any> = {}
    const nodes: Record<string, any> = {}
    const collectVariables = (node: SceneNode) => {
      if ("children" in node) node.children.forEach(child => collectVariables(child));

      if (node.boundVariables) {
        let useNode = false
        const processVariable = (alias: VariableAlias) => {
          // console.log(alias.id)
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
        if (useNode) {
          nodes[node.id] = {
            id: node.id,
            fullName: getFullName(node),
            name: node.name,
            type: node.type,
            variables: node.boundVariables,
            relatedActions: []
          }
        }
      }

      // NOTE: 現状Set Variables, Conditionalのactionは取得できない
      // actionが取得できないreactionはこれらのアクションである可能性がある
      // TODO: 無料プランではここの処理をスキップしたい
      if ("reactions" in node) {
        const getVariable = (aliasId: string | null) => {
          if (!aliasId) return;
          const variable = figma.variables.getVariableById(aliasId);
          if (!variable) return;
          return variable
        }

        let variablesWithTrigger: {
          variable: Variable;
          actionType: string;
        }[] = []

        const collectVariablesFromActions = (actions: Action[]) => {
          actions.forEach(action => {
            if (action.type === 'SET_VARIABLE') {
              const v = getVariable(action.variableId)
              v && variablesWithTrigger.push({
                variable: v,
                actionType: 'SET_VARIABLE',
              })
            } else if (action.type === 'CONDITIONAL') {
              action.conditionalBlocks.forEach(block => {
                const condition = block.condition
                console.log({ condition })
                if (!condition || condition.type !== 'EXPRESSION') return;
                (condition.value as Expression).expressionArguments.forEach(argument => {
                  if (argument.type === 'VARIABLE_ALIAS') {
                    if ("value" in argument && argument.value) {
                      const aliasId = (argument.value as VariableAlias).id
                      const v = getVariable(aliasId)
                      v && variablesWithTrigger.push({
                        variable: v,
                        actionType: 'CONDITION',
                      })
                    }
                  }
                })
                collectVariablesFromActions(block.actions)
              })
            }
          })
        }

        node.reactions.forEach(reaction => {
          console.log('[VariablesViewer]', node.name, reaction)
          console.log(reaction.actions)
          reaction.actions && collectVariablesFromActions(reaction.actions)
          console.log(variablesWithTrigger)
          // if (reaction.action) return
          if (!nodes[node.id]) {
            nodes[node.id] = {
              id: node.id,
              fullName: getFullName(node),
              name: node.name,
              type: node.type,
              variables: {},
              relatedActions: []
            }
          }
          nodes[node.id].relatedActions.push({
            trigger: reaction.trigger,
            variables: variablesWithTrigger
          })
        })
      }
    };

    const selection = figma.currentPage.selection

    // console.log(selection, selection.length)
    if (selection.length === 0)
      return emit('COLLECT_VARIABLES', { variables, nodes, hasSelection: false })
    selection.forEach(node => {
      collectVariables(node)
    })

    emit('COLLECT_VARIABLES', { variables, nodes, hasSelection: true });

  }

  on('INIT', () => inspectVariables())
  figma.on('selectionchange', async () => inspectVariables());

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
