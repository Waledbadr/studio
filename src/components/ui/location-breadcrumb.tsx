import React from 'react';

/**
 * Component to render location breadcrumb paths with proper bi-directional text support.
 * Handles mixed Arabic/English text correctly by displaying LTR overall with each segment auto-detected.
 * 
 * @param path - Location path string with ' -> ' separator (e.g., "Um Al-Salam -> عمارة -> 1 -> حمام 5")
 * @returns Properly formatted breadcrumb with correct visual order
 */
export const LocationBreadcrumb = ({ path }: { path: string }) => (
    <span dir="ltr" style={{textAlign: 'left', display: 'inline-block'}}>
        {path.split(' -> ').map((part, i, arr) => (
            <React.Fragment key={i}>
                <span dir="auto">{part}</span>
                {i < arr.length - 1 && <span> → </span>}
            </React.Fragment>
        ))}
    </span>
);
