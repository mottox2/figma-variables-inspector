import { h } from 'preact'
import { useState } from 'preact/hooks'
import { render, useWindowResize } from '@create-figma-plugin/ui'
import { convertHexColorToRgbColor, convertRgbColorToHexColor, emit, isValidHexColor, on } from '@create-figma-plugin/utilities'

import { ResizeWindowHandler } from './types'

function Plugin() {
  function onWindowResize(windowSize: { width: number; height: number }) {
    emit<ResizeWindowHandler>('RESIZE_WINDOW', windowSize)
  }
  useWindowResize(onWindowResize, {
    maxHeight: 320,
    maxWidth: 320,
    minHeight: 120,
    minWidth: 120,
    resizeBehaviorOnDoubleClick: 'minimize'
  })
  const [data, setData] = useState({})
  on('COLLECT_VARIABLES', ({ data }) => {
    setData(data)
  })
  return <div>
    {Object.keys(data).map(key => {
      const variables = data[key]
      return <div>
        <h3 style={{ fontWeight: 'bold' }}>{key}</h3>
        {variables.map(variable => {
          // console.log(variable)
          const { name, resolvedType, id, defaultValue } = variable
          const value = typeof defaultValue === 'object' && ("r" in defaultValue) && ("g" in defaultValue) && ("b" in defaultValue) ? "#" + convertRgbColorToHexColor(defaultValue) : defaultValue
          console.log({ defaultValue, value })
          return <div>
            {resolvedType} {name}:{value}
          </div>
        })}
      </div>
    })}
  </div>
}

export default render(Plugin)
