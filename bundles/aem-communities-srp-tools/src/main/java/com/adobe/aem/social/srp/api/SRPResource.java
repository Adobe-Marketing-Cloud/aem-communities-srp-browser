package com.adobe.aem.social.srp.api;

import java.util.List;
import java.util.Map;

public interface SRPResource {
    boolean getHasChildren();

    List<SRPResource> getChildren();

    Map<String, Property> getProperties();

    String getParent();

    String getContentComponent();

    String getPath();
}
