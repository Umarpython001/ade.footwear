import { useEffect } from "react";

const SITE_NAME = "Ade Foot Wear";

export function useDocumentTitle(title?: string) {
    useEffect(() => {
        document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Handcrafted Nigerian footwear`;
    }, [title]);
}
