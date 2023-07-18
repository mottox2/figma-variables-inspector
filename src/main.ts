import { emit, on, showUI } from '@create-figma-plugin/utilities'

import { ResizeWindowHandler } from './types'

const getName = (node: FrameNode) => {

}

export default function () {
  on<ResizeWindowHandler>(
    'RESIZE_WINDOW',
    function (windowSize: { width: number; height: number }) {
      const { width, height } = windowSize
      figma.ui.resize(width, height)
    }
  )

  const collectVariables = (node: SceneNode, map: Map<string, any>) => {
    if ("children" in node) node.children.forEach(child => collectVariables(child, map));

    // NOTE: 現状Set Variables, Conditionalのactionは取得できない
    if ("reactions" in node)
      node.reactions.forEach(reaction => console.log('[VariablesViewer]', reaction))

    // console.log('[VariablesViewer]', node.boundVariables)
    if (node.boundVariables) {
      const variables: any = [];
      const processVariable = (alias: VariableAlias) => {
        const variable = figma.variables.getVariableById(alias.id);
        if (!variable) return;
        // console.log(alias, alias.id, v);
        const { name, resolvedType, id, valuesByMode } = variable;
        const defaultValue = valuesByMode[Object.keys(valuesByMode)[0]];
        variables.push({ name, resolvedType, id, defaultValue });
      };
      const { fills, strokes, componentProperties = {}, ...otherVariables } = node.boundVariables
      fills?.forEach(processVariable)
      strokes?.forEach(processVariable)
      Object.entries(componentProperties).forEach(([_, alias]) => processVariable(alias))
      Object.entries(otherVariables).forEach(([_, alias]) => processVariable(alias))
      if (variables.length > 0) map.set(node.name, variables);
    }
  };

  figma.on(
    'selectionchange',
    async () => {
      const selection = figma.currentPage.selection
      console.log(selection)
      const variables = new Map<string, any>()
      selection.forEach(node => {
        collectVariables(node, variables)
      })
      const result = Object.fromEntries(variables)

      emit('COLLECT_VARIABLES', {
        data: result
      });
    }
  );


  showUI({
    height: 480,
    width: 320
  })
}
