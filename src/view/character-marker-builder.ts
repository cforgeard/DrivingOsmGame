import { LngLatLike, Marker } from "mapbox-gl";

export class CharacterMarkerBuilder {
    private readonly _lnglat: LngLatLike;
    private readonly _character: string;
    private _backgroundColor = "black";
    private _textColor = "white";

    constructor(lnglat: LngLatLike, character: string){
        this._lnglat = lnglat;
        this._character = character;
    }

    public setBackgroundColor(backgroundColor: string){
        this._backgroundColor = backgroundColor;
        return this;
    }

    public setTextColor(textColor: string){
        this._textColor = textColor;
        return this;
    }

    public build(){
        const div = document.createElement("div");
        div.style.width = "44px";
        div.style.height = "44px";
        div.style.borderRadius = "50%";
        div.style.border = `2px solid ${this._backgroundColor}`;
        div.style.background = this._backgroundColor;
        div.style.color = this._textColor;
        div.style.boxShadow = "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)";
        div.style.textAlign = "center";
        div.style.fontSize = "25px";
        div.style.paddingTop = "10px";
        div.textContent = this._character;
        
        return new Marker(div).setLngLat(this._lnglat);
    }
}