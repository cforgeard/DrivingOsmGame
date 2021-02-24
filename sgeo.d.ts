declare module 'sgeo' {

    export enum Format {
        d = "d",
        dm = "dm",
        dms = "dms"
    }

    export enum DecimalPlaceCount {
        zero = 0,
        two = 2,
        four = 4
    }

    export function parseDMS(dmsStr: string | number): number;
    export function toDMS(deg: number, format?: Format, dp?: DecimalPlaceCount): string;
    export function toLat(deg: number, format?: Format, dp?: DecimalPlaceCount): string;
    export function toLon(deg: number, format?: Format, dp?: DecimalPlaceCount): string;
    export function toBrng(deg: number, format?: Format, dp?: DecimalPlaceCount): string;
    export function midpoint(points: latlon[]): latlon;

    export class latlon {
        lat: number;
        lng: number;
        constructor(lat: number | string, lon: number | string);
        distanceTo(point: latlon, precision?: number): number;
        distanceRadTo(point: latlon): number;
        bearingTo(point: latlon): number;
        bearingRadTo(point: latlon): number;
        finalBearingTo(point: latlon): number;
        midPointTo(point: latlon): latlon;
        interpolate(point: latlon, num: number): latlon[];
        destinationPoint(brng: number, dist: number): latlon;
        intersection(p1: latlon, brng1: number, p2: latlon, brng2: number): latlon;
        rhumbDistanceTo(point: latlon): number;
        rhumbBearingTo(point: latlon): number;
        rhumbDestinationPoint(brng: number, dist: number): latlon;
        rhumbMidpointTo(point: latlon): latlon;
        //lat(format: Format | null, dp: DecimalPlaceCount | null): number | string;
        //lon(format: Format | null, dp: DecimalPlaceCount | null): number | string;
        toString(format: Format | null, dp: DecimalPlaceCount | null): string;
    }

}
