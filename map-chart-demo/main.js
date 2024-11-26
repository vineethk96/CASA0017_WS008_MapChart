import './style.css'
import { BASEMAP } from '@deck.gl/carto';
import { Map,Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer,GeoJsonLayer,TextLayer } from '@deck.gl/layers';


//Initialise Maplibre BaseMap
const map = new Map({
  container: 'map',
  style: BASEMAP.DARK_MATTER,
  interactive: true,
  center:[-0.12262486445294093,51.50756471490389],
  zoom: 12
})

// Wait for Map to fully Load
await map.once('load');

const layers = map.getStyle().layers;

// Find the first layer in map style
let firstSymbolId;
for (const layer of layers){
  if(layer.type === 'line'){  // symbol for labels; line for roads
    firstSymbolId = layer.id;
    console.log(firstSymbolId);
    break;
  }
}

// Overlay DeckGL Layer
const deckOverlay = new MapboxOverlay({
  interleaved: true,
  layers: [
    new ScatterplotLayer({
      id: 'deckgl-circle',
      data: [
        {position: [-0.12262486445294093,51.50756471490389]},
      ],
      getPosition: d => d.position, // Arrow Function!
      getFillColor: [255, 50, 0, 150],
      getRadius: 1000,
      beforeId: firstSymbolId
    })
  ]
});

map.addControl(deckOverlay); // In interleaved mode, render the layer under map layers

const COUNTRIES = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
const POPULATION = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson'

// Layers in DeckGL can be updated using setProps.
// Operation removes any previous layer that is not being carried over.
deckOverlay.setProps({
  layers: [
    ...deckOverlay._props.layers, // Carry over initial layers

    // Polygon Layer in GeoJson
    new GeoJsonLayer({
      id: 'base-map',   // every layer needs a unique ID
      data: COUNTRIES,  // Data passed in as a car or inline

      // Styles
      stroked: true,
      filled: false,
      lineWidthMinPixels: 2,
      opacity: 0.7,
      getLineColor: [252,148,3],
      
      beforeId: firstSymbolId
    }),

    // Point Layer in GeoJson
    new GeoJsonLayer({
      id: 'deckgl-population',
      data: POPULATION,
      dataTransform: data => data.features.filter(filteredData => filteredData.properties.featurecla === 'Admin-0 capital'),

      // Styles
      filled: true,
      pointRadiusScale: 10,
      getPointRadius: filteredData => filteredData.properties.pop_max / 1000,
      getFillColor: [50, 50, 200,190],
      beforeID: firstSymbolId
    }),

    new TextLayer({
      id: 'text-layer',
      data: POPULATION,
      dataTransform: d => d.features.filter(f => f.properties.featurecla === 'Admin-0 capital'),
      getPosition: f => f.geometry.coordinates,
      getText: f => { return f.properties.pop_max.toString(); },
      getSize: 22,
      getColor: [0, 0, 0, 180],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      fontFamily: 'Gill Sans',
      background: true,
      getBackgroundColor: [255, 255, 255,180]
  }),
  ]
})