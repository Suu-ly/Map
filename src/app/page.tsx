"use client";

import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import { Feature, FeatureCollection } from "geojson";
import { ChevronsUpDown } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useState } from "react";
import {
  Layer,
  Map,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  StyleSpecification,
  TerrainControl,
  useMap,
} from "react-map-gl/maplibre";
import volcanoes from "../assets/EOS_volcanoes.xlsx";
import earthquakes from "../assets/isc-ehb.csv";
import faultData from "../assets/philippines_faults_2020.geojson";
import volanoIcon from "../assets/volcano_icon.png";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";

const MAP_STYLE: {
  style: StyleSpecification | string;
  label: string;
  img: string;
}[] = [
  {
    style: "https://tiles.openfreemap.org/styles/liberty",
    label: "Openfreemap",
    img: "https://d4.alternativeto.net/JtcJ1s6H8N100N4sgtNEm2YThMGoMBeD53KKBPzGn3w/rs:fill:309:197:1/g:no:0:0/YWJzOi8vZGlzdC9zL29wZW5mcmVlbWFwXzk3MDE0OV9mdWxsLnBuZw.jpg",
  },
  {
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution:
            "&copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm",
        },
      ],
      glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    },
    label: "Openstreetmap",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Soho_-_map_1.png/220px-Soho_-_map_1.png",
  },
  {
    style: {
      version: 8,
      sources: {
        otm: {
          type: "raster",
          tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png "],
          maxzoom: 15,
          attribution:
            "map data: &copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors, <a href='http://viewfinderpanoramas.org/' target='_blank'>SRTM</a> | map style: &copy; <a href='https://opentopomap.org/' target='_blank'>OpenTopoMap</a>",
        },
      },
      layers: [
        {
          id: "otm",
          type: "raster",
          source: "otm",
        },
      ],
      glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    },
    label: "Opentopomap",
    img: "https://latlong.blog/img/blog/2023-10-02-tracestack-topo.webp",
  },
  {
    style: {
      version: 8,
      sources: {
        esri: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",
          ],
          tileSize: 256,
          attribution:
            "Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), &copy; <a href='https://openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> Contributors, and the GIS User Community",
        },
      },
      layers: [
        {
          id: "esri",
          type: "raster",
          source: "esri",
        },
      ],
      glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    },
    label: "Satellite",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXhvrlM50ZXAuvt7S8uXh9My90_uTQf9cyYg&s",
  },
  {
    style: {
      version: 8,
      sources: {
        ocean: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png",
          ],
          maxzoom: 10,
          tileSize: 256,
          attribution:
            "Esri, GEBCO, NOAA, National Geographic, Garmin, HERE, Geonames.org, and other contributors",
        },
        oceanRef: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}.png",
          ],
          maxzoom: 10,
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "ocean",
          type: "raster",
          source: "ocean",
        },
        {
          id: "oceanRef",
          type: "raster",
          source: "oceanRef",
        },
      ],
      glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    },
    label: "Ocean",
    img: "https://learn.arcgis.com/en/projects/find-ocean-bathymetry-data/GUID-FE9C4F4D-E9AA-46CD-9C3F-D7DB28FBCBCC-web.png",
  },
];

function Home() {
  const { map } = useMap();
  const [showFault, setShowFault] = useState(true);
  const [showVolcanoes, setShowVolcanoes] = useState(true);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showHillshade, setShowHillshade] = useState(false);
  const [showSeafloor, setShowSeafloor] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    feature: MapGeoJSONFeature;
    lng: number;
    lat: number;
  }>();

  const [selectedFeature, setselectedFeature] = useState<{
    feature: MapGeoJSONFeature;
    lng: number;
    lat: number;
  }>();

  const [mapIndex, setMapIndex] = useState(0);

  const onHover = useCallback(
    (event: MapLayerMouseEvent) => {
      const {
        features,
        lngLat: { lng, lat },
      } = event;
      const hoveredFeature = features && features[0];
      if (hoveredFeature && map) {
        if (hoverInfo) {
          map.setFeatureState(
            {
              source: hoverInfo.feature.layer.source,
              id: hoverInfo.feature.id,
            },
            { hover: false },
          );
        }
        if (
          !selectedFeature ||
          (selectedFeature && selectedFeature.feature.id !== hoveredFeature.id)
        ) {
          setHoverInfo({ feature: hoveredFeature, lng, lat });
          map.setFeatureState(
            { source: hoveredFeature.layer.source, id: hoveredFeature.id },
            { hover: true },
          );
        }
      } else if (map) {
        if (hoverInfo) {
          map.setFeatureState(
            {
              source: hoverInfo.feature.layer.source,
              id: hoverInfo.feature.id,
            },
            { hover: false },
          );
        }
        setHoverInfo(undefined);
      }
    },
    [hoverInfo, map, selectedFeature],
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const {
        features,
        lngLat: { lng, lat },
      } = event;
      const clicked = features && features[0];
      if (clicked && map) {
        setselectedFeature({ feature: clicked, lng, lat });
      }
    },
    [map],
  );

  const xlsxToGeojson = (
    input: Record<string, string | number>[],
  ): FeatureCollection => {
    const features: Feature[] = [];
    for (let i = 0; i < input.length; i++) {
      features.push({
        type: "Feature",
        properties: {
          ...input[i],
        },
        geometry: {
          type: "Point",
          coordinates: [
            input[i].Longitude as number,
            input[i].Latitude as number,
          ],
        },
      });
    }
    return {
      type: "FeatureCollection",
      features: features,
    };
  };

  const csvToGeojson = (
    input: Record<string, string | number>[],
  ): FeatureCollection => {
    const features: Feature[] = [];
    for (let i = 0; i < input.length; i++) {
      features.push({
        type: "Feature",
        properties: {
          ...input[i],
        },
        geometry: {
          type: "Point",
          coordinates: [input[i].lon as number, input[i].lat as number],
        },
      });
    }
    return {
      type: "FeatureCollection",
      features: features,
    };
  };

  const volcanoData = xlsxToGeojson(volcanoes);
  const earthquakeData = csvToGeojson(earthquakes);

  useEffect(() => {
    const addImages = async () => {
      if (map) {
        const image = await map.loadImage(volanoIcon.src);
        try {
          map.addImage("volcano_icon", image.data);
        } catch {
          console.log("Image already exists");
        }
      }
    };
    addImages();
  }, [map, mapIndex]);

  return (
    <main className="h-screen w-full">
      <div className="absolute left-4 top-4 z-10 flex max-h-[calc(100vh-32px)] w-40 flex-col gap-2">
        <Collapsible
          defaultOpen={false}
          className="flex flex-col overflow-hidden rounded-xl bg-white p-1 shadow-md"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
            Basemap
            <ChevronsUpDown />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex shrink flex-col gap-2 overflow-auto data-[state=open]:p-1">
            {MAP_STYLE.map((style, index) => {
              return (
                <label className="min-w-fit grow" key={style.label}>
                  <input
                    type="radio"
                    name="map"
                    value={style.label}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                    onClick={() => setMapIndex(index)}
                  />
                  <div className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 p-2 font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked:ring-2 peer-focus-visible:outline-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={style.img}
                      className="h-20 w-full rounded-md"
                      alt={style.label}
                    />
                    {style.label}
                  </div>
                </label>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
        <Collapsible className="flex flex-col rounded-xl bg-white p-1 shadow-md">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
            Data overlay
            <ChevronsUpDown />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex shrink flex-col gap-2 overflow-auto data-[state=open]:p-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="switch"
                className="text-xs font-medium text-zinc-700"
              >
                Faults
              </label>
              <Switch
                id="switch"
                checked={showFault}
                onCheckedChange={(e: boolean) => setShowFault(e)}
              />
            </div>
            {/* <Button asChild className="w-full">
            <a href="./assets/philippines_faults_2020.geojson" download>
              <Download /> Download
            </a>
          </Button> */}
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <label
                htmlFor="switch"
                className="text-xs font-medium text-zinc-700"
              >
                Volcanoes
              </label>
              <Switch
                id="switch"
                checked={showVolcanoes}
                onCheckedChange={(e: boolean) => setShowVolcanoes(e)}
              />
            </div>
            {/* <Button asChild className="w-full">
            <a href="./assets/EOS_volcanoes.xlsx" download>
              <Download /> Download
            </a>
          </Button> */}
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <label
                htmlFor="switch"
                className="text-xs font-medium text-zinc-700"
              >
                Earthquakes
              </label>
              <Switch
                id="switch"
                checked={showEarthquakes}
                onCheckedChange={(e: boolean) => setShowEarthquakes(e)}
              />
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <label
                htmlFor="switch"
                className="text-xs font-medium text-zinc-700"
              >
                Seafloor Age
              </label>
              <Switch
                id="switch"
                checked={showSeafloor}
                onCheckedChange={(e: boolean) => setShowSeafloor(e)}
              />
            </div>
            {showSeafloor && (
              <div>
                <div className="mb-1 h-10 w-full bg-gradient-to-r from-black to-white"></div>
                <div className="flex w-full justify-between text-xs">
                  <p>0</p>
                  <p>194</p>
                </div>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <label
                htmlFor="switch"
                className="text-xs font-medium text-zinc-700"
              >
                Hillshading
              </label>
              <Switch
                id="switch"
                checked={showHillshade}
                onCheckedChange={(e: boolean) => setShowHillshade(e)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      <Map
        id="map"
        initialViewState={{
          longitude: 110,
          latitude: 5,
          zoom: 4.6,
        }}
        maxZoom={15}
        mapStyle={MAP_STYLE[mapIndex].style}
        onMouseMove={onHover}
        onClick={onClick}
        interactiveLayerIds={["faultLines", "volcanoes", "earthquakes"]}
        reuseMaps
      >
        <ScaleControl />
        <NavigationControl />
        <TerrainControl source={"terrain"} exaggeration={1.5} />
        <Source
          id="seafloorSource"
          type="raster"
          tiles={[
            `https://api.mapbox.com/v4/lance-ntu.seafloor/{z}/{x}/{y}.webp?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
          ]}
          maxzoom={5}
          tileSize={256}
        >
          <Layer
            type="raster"
            id="seafloor"
            layout={{ visibility: showSeafloor ? "visible" : "none" }}
          />
        </Source>
        <Source
          id="terrain"
          type="raster-dem"
          tiles={[
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
          ]}
          maxzoom={13}
          tileSize={256}
          encoding="terrarium"
          attribution={
            "* ArcticDEM terrain data DEM(s) were created from DigitalGlobe, Inc., imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736;\n* Australia terrain data © Commonwealth of Australia (Geoscience Australia) 2017;\n* Austria terrain data © offene Daten Österreichs – Digitales Geländemodell (DGM) Österreich;\n* Canada terrain data contains information licensed under the Open Government Licence – Canada;\n* Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers;\n* Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration\n* Mexico terrain data source: INEGI, Continental relief, 2016;\n* New Zealand terrain data Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government (All rights reserved);\n* Norway terrain data © Kartverket;\n* United Kingdom terrain data © Environment Agency copyright and/or database right 2015. All rights reserved;\n* United States 3DEP (formerly NED) and global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey."
          }
        >
          <Layer
            type="hillshade"
            id="terrainHillshade"
            paint={{
              "hillshade-shadow-color": "#17292b",
              "hillshade-highlight-color": "#ebf0f5",
              "hillshade-exaggeration": 0.4,
            }}
            layout={{
              visibility: showHillshade ? "visible" : "none",
            }}
          />
        </Source>
        <Source
          id="volcanoSource"
          type="geojson"
          data={volcanoData}
          promoteId="Volcano Number"
        >
          <Layer
            id="volcanoes"
            type="symbol"
            layout={{
              "icon-image": "volcano_icon",
              "text-field": ["get", "VOLCANO"],
              "text-font": ["Noto Sans Regular"],
              "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.3, 10, 1],
              "text-offset": [0, 1],
              "text-anchor": "top",
              "text-size": 12,
              "text-optional": true,
              "icon-overlap": "always",
              visibility: showVolcanoes ? "visible" : "none",
            }}
            paint={{
              "text-halo-color": "#F8FAFCCC",
              "text-halo-width": 2,
              "text-opacity": {
                type: "interval",
                stops: [
                  [7, 0],
                  [8, 1],
                ],
              },
            }}
          />
        </Source>
        <Source
          id="earthquakeSource"
          type="geojson"
          data={earthquakeData}
          promoteId={"mw"}
        >
          <Layer
            id="earthquakes"
            type="circle"
            layout={{ visibility: showEarthquakes ? "visible" : "none" }}
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                ["interpolate", ["exponential", 2], ["get", "mw"], 2, 2, 9, 16],
                15,
                [
                  "interpolate",
                  ["exponential", 2],
                  ["get", "mw"],
                  2,
                  12,
                  9,
                  48,
                ],
              ],
              "circle-stroke-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                0,
                13,
                2,
              ],
              "circle-opacity": 0.7,
              "circle-color": [
                "interpolate",
                ["linear"],
                ["get", "depth"],
                4,
                "#fff7ec",
                8,
                "#fee8c8",
                16,
                "#fdd49e",
                32,
                "#fdbb84",
                64,
                "#eb7c49",
                128,
                "#db5235",
                256,
                "#b52112",
                512,
                "#750606",
                640,
                "#120504",
              ],
            }}
          />
        </Source>
        <Source id="fault" type="geojson" data={faultData} promoteId="globalid">
          <Layer
            id="faultLines"
            type="line"
            layout={{
              "line-cap": "round",
              visibility: showFault ? "visible" : "none",
            }}
            paint={{
              "line-color": "#f43f5e",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                ["case", ["boolean", ["feature-state", "hover"], false], 6, 1],
                15,
                ["case", ["boolean", ["feature-state", "hover"], false], 16, 6],
              ],
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                1,
                15,
                0.6,
              ],
            }}
          />
        </Source>
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lng}
            latitude={hoverInfo.lat}
            offset={{
              center: [0, 0],
              top: [0, 12],
              "top-left": [0, 12],
              "top-right": [0, 12],
              bottom: [0, -12],
              "bottom-left": [0, -12],
              "bottom-right": [0, -12],
              left: [12, 0],
              right: [-12, 0],
            }}
            closeButton={false}
            closeOnClick={true}
            className={
              "[&_.maplibregl-popup-content]:px-4 [&_.maplibregl-popup-content]:py-3 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md"
            }
          >
            {hoverInfo.feature.layer.id === "faultLines" && (
              <div className="mb-2 text-lg font-semibold">
                {hoverInfo.feature.properties.d_fname}
              </div>
            )}
            {hoverInfo.feature.layer.id === "volcanoes" && (
              <div className="mb-2 text-lg font-semibold">
                {hoverInfo.feature.properties.VOLCANO}
              </div>
            )}
            {Object.entries(hoverInfo.feature.properties).map(
              ([key, value]) => {
                return (
                  <div className="text-sm" key={key}>
                    <span className="font-semibold">{key}:</span> {value}
                  </div>
                );
              },
            )}
          </Popup>
        )}
        {selectedFeature && (
          <Popup
            key={`${selectedFeature.feature.id}click`}
            longitude={selectedFeature.lng}
            latitude={selectedFeature.lat}
            offset={{
              center: [0, 0],
              top: [0, 12],
              "top-left": [0, 12],
              "top-right": [0, 12],
              bottom: [0, -12],
              "bottom-left": [0, -12],
              "bottom-right": [0, -12],
              left: [12, 0],
              right: [-12, 0],
            }}
            closeButton={true}
            onClose={() => setselectedFeature(undefined)}
            closeOnClick={false}
            className={
              "[&_.maplibregl-popup-close-button]:px-1.5 [&_.maplibregl-popup-content]:px-4 [&_.maplibregl-popup-content]:py-3 [&_.maplibregl-popup-content]:font-sans [&_.maplibregl-popup-content]:shadow-md"
            }
          >
            {selectedFeature.feature.layer.id === "faultLines" && (
              <div className="mb-2 text-lg font-semibold">
                {selectedFeature.feature.properties.d_fname}
              </div>
            )}
            {selectedFeature.feature.layer.id === "volcanoes" && (
              <div className="mb-2 text-lg font-semibold">
                {selectedFeature.feature.properties.VOLCANO}
              </div>
            )}
            {Object.entries(selectedFeature.feature.properties).map(
              ([key, value]) => {
                return (
                  <div className="text-sm" key={key}>
                    <span className="font-semibold">{key}:</span> {value}
                  </div>
                );
              },
            )}
          </Popup>
        )}
      </Map>
    </main>
  );
}
export default Home;
