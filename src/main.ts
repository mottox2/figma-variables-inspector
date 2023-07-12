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
        const variables = node.boundVariables ?? [key]
        map.set(node.name, variables)
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
