import { AbstractView } from "../abstract-view";
import * as mapbox from "mapbox-gl";
import { SimpleEventDispatcher } from "ste-simple-events";
import { OsmTile } from "../osm-data/osm-tile";
import { SpinnerView } from "./spinner-view";

export class GameView extends AbstractView {

    private _mapboxMap: mapbox.Map;
    private _markers: Map<string, mapbox.Marker>;
    private _leftTurnIndicatorDiv: HTMLElement;
    private _rightTurnIndicatorDiv: HTMLElement;
    private _spinnerView: SpinnerView;

    private _onMapRenderedDispatcher = new SimpleEventDispatcher<null>();
    private _onMapTileLoadDispatcher = new SimpleEventDispatcher<OsmTile>();
    private _onKeyDownDispatcher = new SimpleEventDispatcher<string>();

    public get onMapRendered() {
        return this._onMapRenderedDispatcher.asEvent();
    }

    public get onMapTileLoad() {
        return this._onMapTileLoadDispatcher.asEvent();
    }

    public get onKeyDown() {
        return this._onKeyDownDispatcher.asEvent();
    }

    constructor(mapboxAccessToken: string, mapboxStyle: string) {
        super();
        (mapbox as any).accessToken = mapboxAccessToken;

        (window as any).view = this;
        this.viewRoot.classList.add("full-screen");
        this.viewRoot.innerHTML = `
        <div class="full-screen" id="map"></div>
        <div class="center-screen vehicle-img"></div>
        <div class="left-down card horizontal is-size-4 padding-12">
            <div id="leftTurnIndicator" style="visibility: hidden">⬅️</div>
            <div id="rightTurnIndicator" style="visibility: hidden">➡️</div>
            <button style="margin: 4px" id="upBtn">Up</button>
            <button style="margin: 4px" id="downBtn">Down</button>
            <button style="margin: 4px" id="leftBtn">Left</button>
            <button style="margin: 4px" id="rightBtn">Right</button>
        </div>
        `;

        this._mapboxMap = new mapbox.Map({
            container: AbstractView.nonNullQuerySelector(this.viewRoot, "#map"),
            failIfMajorPerformanceCaveat: true,
            interactive: false,
            pitch: 50,
            refreshExpiredTiles: false,
            maxTileCacheSize: 999,
            zoom: 18.5,
            style: mapboxStyle
        });

        this._markers = new Map<string, mapbox.Marker>();
        this._spinnerView = new SpinnerView();
        this._spinnerView.setSpinnerActive(true);
        this._leftTurnIndicatorDiv = AbstractView.nonNullQuerySelector(this.viewRoot, "#leftTurnIndicator");
        this._rightTurnIndicatorDiv = AbstractView.nonNullQuerySelector(this.viewRoot, "#rightTurnIndicator");

        AbstractView.nonNullQuerySelector(this.viewRoot, "#leftBtn").addEventListener("click", ()=>{
            this._onKeyDown("ArrowLeft");
        });
        AbstractView.nonNullQuerySelector(this.viewRoot, "#rightBtn").addEventListener("click", ()=>{
            this._onKeyDown("ArrowRight");
        });
        AbstractView.nonNullQuerySelector(this.viewRoot, "#upBtn").addEventListener("click", ()=>{
            this._onKeyDown("ArrowUp");
        });
        AbstractView.nonNullQuerySelector(this.viewRoot, "#downBtn").addEventListener("click", ()=>{
            this._onKeyDown("ArrowDown");
        });

        document.addEventListener("keydown", (evt)=>this._onKeyDown(evt.key));
        this._mapboxMap.on("render", this._onMapRendered);
        this._mapboxMap.on("sourcedataloading", this._onSourceDataLoading);
    }

    public destroy() {
        this._spinnerView.destroy();
        this._mapboxMap.off("render", this._onMapRendered);
        this._mapboxMap.off("sourcedataloading", this._onSourceDataLoading);
        //document.removeEventListener("keydown", this._onKeyDown);
        this._mapboxMap.remove();
    }

    public addGeoJSONLineToMap(coor: number[][]) {
        this._mapboxMap.addLayer({
            "id": Math.random().toString(),
            "type": "line",
            source: {
                type: "geojson",
                data: {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: coor
                    }
                }
            },
            layout: {
                "line-join": "round",
                "line-cap": "round"
            },
            paint: {
                "line-color": "#888",
                "line-width": 8
            }
        })
    }

    public addMarker(id: string, marker: mapbox.Marker) {
        if (this._markers.has(id)) {
            throw new Error(`Marker with id ${id} already exists`);
        }
        this._markers.set(id, marker);
        marker.addTo(this._mapboxMap);
    }

    public getMarker(id: string) {
        return this._markers.get(id);
    }

    public removeMarker(id: string) {
        const marker = this._markers.get(id);
        if (!marker) {
            throw new Error(`Marker with id ${id} not exists`);
        }
        marker.remove();
        this._markers.delete(id);
    }

    public get markers() {
        return this._markers;
    }

    public setLoadingSpinnerActive(active: boolean) {
        this._spinnerView.setSpinnerActive(active);
    }

    public setLeftIndicatorActive(active: boolean) {
        this._leftTurnIndicatorDiv.style.visibility = active ? "visible" : "hidden";
    }

    public setRightIndicatorActive(active: boolean) {
        this._rightTurnIndicatorDiv.style.visibility = active ? "visible" : "hidden";
    }

    public setMapCenter(center: mapbox.LngLatLike) {
        this._mapboxMap.setCenter(center);
    }

    public setMapBearing(bearingVal: number) {
        this._mapboxMap.easeTo({ bearing: bearingVal, duration: 200 });
    }

    private _onSourceDataLoading = (evt: mapbox.MapDataEvent | any) => {
        if (evt.coord && !evt.isSourceLoaded) {
            const tile = evt.coord.canonical;
            this._onMapTileLoadDispatcher.dispatchAsync(new OsmTile(tile.x, tile.y, tile.z));
        }
    }

    private _onMapRendered = () => {
        this._onMapRenderedDispatcher.dispatchAsync(null);
    }

    private _onKeyDown = (key: string) => {
        this._onKeyDownDispatcher.dispatchAsync(key);
    }
}