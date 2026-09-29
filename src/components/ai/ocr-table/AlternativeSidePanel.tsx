"use client";

import React from "react";

export type AlternativeSidePanelLine = {
    selected_item: { id: string; name: string; price: number; };
    quantity: number;
    alternatives: Array<{ id: string; name: string; price: number; }>;
};

export type AlternativeSidePanelProps = {
    open: boolean;
    line: AlternativeSidePanelLine | null;
    onClose: () => void;
    alternativesCount: number;
    onSelectAlternative: (alternativeId: string) => void;
    tenant?: any;
};

export default function AlternativeSidePanel({ open }: AlternativeSidePanelProps): React.ReactElement {
    return <div aria-hidden="true" />;
}