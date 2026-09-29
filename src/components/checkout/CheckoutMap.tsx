"use client";

import React, { useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface CheckoutMapProps {
    mapCenter: [number, number];
    markerPos: [number, number];
    zoomLevel: number;
    onMapClick: (lat: number, lng: number) => void;
    onMarkerDragEnd: (lat: number, lng: number) => void;
    setMapRef: (mapInstance: any) => void;
}

export default function CheckoutMap({
    mapCenter,
    markerPos,
    zoomLevel,
    onMapClick,
    onMarkerDragEnd,
    setMapRef
}: CheckoutMapProps) {
    
    function MapEventsHandler() {
        useMapEvents({
            click(e) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        });
        return null;
    }

    const handleDragEnd = (e: any) => {
        const marker = e.target;
        if (marker != null) {
            const latLng = marker.getLatLng();
            onMarkerDragEnd(latLng.lat, latLng.lng);
        }
    };

    return (
        <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            style={{ width: "100%", height: "100%" }}
            ref={setMapRef}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&amp;copy; OpenStreetMap contributors'
            />
            <Marker
                position={markerPos}
                icon={defaultIcon}
                draggable={true}
                eventHandlers={{ dragend: handleDragEnd }}
            />
            <MapEventsHandler />
        </MapContainer>
    );
}