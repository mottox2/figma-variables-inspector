import { FunctionComponent, JSX, h } from 'preact'
import { useState } from 'preact/hooks'
import { IconLayerComponent16, IconLayerEllipse16, IconLayerFrame16, IconLayerGroup16, IconLayerInstance16, IconLayerLine16, IconLayerRectangle16, IconLayerText16, Layer, render, useWindowResize } from '@create-figma-plugin/ui'
import { convertRgbColorToHexColor, emit, on } from '@create-figma-plugin/utilities'

import { ResizeWindowHandler } from './types'

const VariableText: FunctionComponent<{
  title: string
}> = ({ children, title }) => {
  return <span title={title} style={{ fontSize: 11, padding: '1px 5px', borderRadius: 4, border: 'var(--figma-color-border) 1px solid', backgroundColor: 'var(--figma-color-bg-secondary)' }}>
    {children}
  </span>
}

const Variable = ({ label, variable }: any) => {
  const { name, resolvedType, id, defaultValue } = variable
  const isColor = resolvedType === 'COLOR' && typeof defaultValue === 'object' && ("r" in defaultValue) && ("g" in defaultValue) && ("b" in defaultValue)
  const value = isColor ? "#" + convertRgbColorToHexColor(defaultValue) : defaultValue
  return <div style={{ padding: '4px 16px 4px 36px', display: 'flex', alignItems: 'center' }}>{label}
    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>{isColor && <span style={{
      width: 16, height: 16, display: 'inline-block', backgroundColor: value
  }}>
    </span>} <VariableText title={value}>{name}</VariableText>
    </span>
  </div>
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
    {Object.values(nodes).reverse().map(node => {
      console.log({ node })
      const { id, type, variables: aliases, name, fullName, relatedActions } = node as {
        id: string
        type: string,
        name: string
        fullName: string
        variables: SceneNodeMixin['boundVariables'],
        relatedActions: string[]
      }
      const { fills, strokes, componentProperties = {}, ...otherVariables } = aliases || {}

      type NodeType = SceneNode['type']
      const icon = ({
        'COMPONENT': <IconLayerComponent16 />,
        'INSTANCE': <IconLayerInstance16 />,
        'TEXT': <IconLayerText16 />,
        'ELLIPSE': <IconLayerEllipse16 />,
        'FRAME': <IconLayerFrame16 />,
        'GROUP': <IconLayerGroup16 />,
        'LINE': <IconLayerLine16 />,
        'RECTANGLE': <IconLayerRectangle16 />,
      } as Record<NodeType, JSX.Element>)[type as NodeType]
      return <div>
        <Layer icon={icon} value={false} style={{ textOverflow: 'ellipsis ellipsis' }}>
          <span style={{ opacity: 0.5 }}>{fullName.replace(new RegExp(String.raw`/${name}$`), '')}/</span>{name}
        </Layer>
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
          return <div style={{ padding: '6px 16px 6px 36px' }}>{trigger} <span style={{ opacity: 0.5 }}>may have variable related actions</span></div>
        })}
      </div>
    })}
  </div>
}

export default render(Plugin)
