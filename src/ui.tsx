import { FunctionComponent, h } from 'preact'
import { useState } from 'preact/hooks'
import { render, useWindowResize } from '@create-figma-plugin/ui'
import { convertRgbColorToHexColor, emit, on } from '@create-figma-plugin/utilities'

import { ResizeWindowHandler } from './types'

const VariableText: FunctionComponent<{
  title: string
}> = ({ children, title }) => {
  return <span title={title} style={{ fontSize: 11, padding: '1px 5px', border: 'var(--figma-color-border)1px solid', backgroundColor: 'var(--figma-color-bg-secondary)' }}>
    {children}
  </span>
}

const Variable = ({ label, variable }: any) => {
  const { name, resolvedType, id, defaultValue } = variable
  const isColor = resolvedType === 'COLOR' && typeof defaultValue === 'object' && ("r" in defaultValue) && ("g" in defaultValue) && ("b" in defaultValue)
  const value = isColor ? "#" + convertRgbColorToHexColor(defaultValue) : defaultValue
  return <div>{label}: {isColor && <span style={{
    width: 16, height: 16, display: 'inline-block', verticalAlign: 'middle', backgroundColor: value
  }}>
  </span>} <VariableText title={value}>{name}</VariableText>:{value}</div>
}

function Plugin() {
  function onWindowResize(windowSize: { width: number; height: number }) {
    emit<ResizeWindowHandler>('RESIZE_WINDOW', windowSize)
  }
  useWindowResize(onWindowResize, {
    maxHeight: 640,
    maxWidth: 320,
    minHeight: 120,
    minWidth: 120,
    resizeBehaviorOnDoubleClick: 'minimize'
  })
  const [data, setData] = useState<{
    nodes: Record<string, any>
    variables: Record<string, any>
  }>({
    nodes: {},
    variables: {}
  })
  on('COLLECT_VARIABLES', (data) => {
    setData(data)
    console.log(data)
  })
  const { variables, nodes } = data

  return <div>
    {Object.values(nodes).map(node => {
      console.log({ node })
      const { id, variables: aliases, name, relatedActions } = node as {
        id: string
        name: string
        variables: SceneNodeMixin['boundVariables'],
        relatedActions: string[]
      }
      const { fills, strokes, componentProperties = {}, ...otherVariables } = aliases || {}
      return <div>
        <h3 style={{ fontWeight: 'bold' }}>{name}</h3>
        {fills?.map(fill => {
          return <Variable label="fill" variable={variables[fill.id]} />
        })}
        {strokes?.map(stroke => {
          return <Variable label="stroke" variable={variables[stroke.id]} />
        })}
        {Object.entries(componentProperties).map(([property, alias]) => {
          return <Variable label={property} variable={variables[alias.id]} />
        })}
        {Object.entries(otherVariables).map(([property, alias]) => {
          return <Variable label={property} variable={variables[alias.id]} />
        })}
        {relatedActions.map(trigger => {
          return <div>{trigger} may have variable related actions</div>
        })}
      </div>
    })}
  </div>
}

export default render(Plugin)
