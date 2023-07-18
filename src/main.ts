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
    if ("children" in node) {
      node.children.forEach(child => {
        collectVariables(child, map);
      });
    }

    if ("reactions" in node) {
      // NOTE: 現状Set Variables, Conditionalのactionは取得できない
      node.reactions.forEach(reaction => {
        console.log(reaction);
      })
    }

    if (node.boundVariables) {
      const variables: any = [];
      Object.entries(node.boundVariables).forEach(([key, vAliasOrAliases]) => {
        // console.log({ key, name: node.name, vAliasOrAliases });
        if (!vAliasOrAliases) return;

        const processVariable = (alias: any) => {
          const v = figma.variables.getVariableById(alias.id);
          // console.log(alias, v);
          if (v) {
            const { name, resolvedType, id, valuesByMode } = v;
            const defaultValue = valuesByMode[Object.keys(valuesByMode)[0]];
            variables.push({ name, resolvedType, id, defaultValue });
          }
        };

        if (Array.isArray(vAliasOrAliases)) {
          vAliasOrAliases.forEach(processVariable);
        } else {
          processVariable(vAliasOrAliases);
        }

        console.log(node.name, variables)
      });
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
    height: 320,
    width: 240
  })
}
