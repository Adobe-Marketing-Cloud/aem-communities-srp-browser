package com.adobe.aem.social.srp.api;

import org.apache.sling.api.resource.ResourceResolver;

public interface ResourceBrowser {
    /**
     * @param contentComponentPath - path to a communities component in the /content tree
     * @param resolver - ResourceResolver to use to look up the SRPResource
     * @return corresponding SRPResource parent for the community component
     */
    SRPResource getResourcesForComponent(String contentComponentPath, ResourceResolver resolver);

    /**
     * @param srpPath path to the UGC that is being requested
     * @param resolver resolver to use to look up the UGC resource
     * @return SRPResource representing the srpPath
     */
    SRPResource getUGCResource(String srpPath, ResourceResolver resolver);
}
