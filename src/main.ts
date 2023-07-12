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
        collectVariables(child, map)
      })
    }
    if (node.boundVariables) {
      Object.keys(node.boundVariables).forEach(key => {
        console.log({ key, name: node.name, a: node.boundVariables })
        if (!node.boundVariables) return
        const _key = key as VariableBindableNodeField // FIXME
        const vAliasOrAliases = node.boundVariables[_key] // FIXME
        if (!vAliasOrAliases) return
        const variables = []
        if (Array.isArray(vAliasOrAliases)) { // filles, strokes, componentProperties
          vAliasOrAliases.forEach(alias => {
            const v = figma.variables.getVariableById(alias.id)
            // console.log(key, alias.id, v)
            console.log(v)
            if (v) {
              const { name, resolvedType, id, valuesByMode } = v
              const defaultValue = valuesByMode[Object.keys(valuesByMode)[0]]
              variables.push({ name, resolvedType, id, defaultValue })
            }
          })
        } else {
          const v = figma.variables.getVariableById(vAliasOrAliases.id)
          // console.log(key, vAliasOrAliases.id, v)
          console.log(v)
          if (v) {
            const { name, resolvedType, id, valuesByMode } = v
            // 本来はvariablesのvariableCollectionIdをもとにcollectionを取得
            // collectionからmodeを取得し、現在のNodeがどのmodeにあるかを判定しないといけないが面倒なので、最初のvalueを取得することにした
            const defaultValue = valuesByMode[Object.keys(valuesByMode)[0]]
            variables.push({ name, resolvedType, id, defaultValue })
          }
        }
        map.set(node.name, variables)

        // if (!node.boundVariables) return
        // map.set(node.name, variables)
      })
    }
  }

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
    height: 240,
    width: 240
  })
}
