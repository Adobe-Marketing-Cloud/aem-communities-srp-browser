package com.adobe.aem.social.srp.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceNotFoundException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;

import com.adobe.aem.social.srp.api.Property;
import com.adobe.aem.social.srp.api.SRPResource;
import com.adobe.cq.social.srp.SocialResource;
import com.adobe.cq.social.srp.SocialResourceProvider;
import com.adobe.cq.social.srp.utilities.api.SocialResourceUtilities;

public class SRPResourceImpl implements SRPResource {

    private final Resource srpResource;
    private final long count;
    private final List<SRPResource> children;
    private final ResourceResolver resolver;
    private final SocialResourceUtilities socialUtils;
    private final SocialResourceProvider srp;

    public SRPResourceImpl(final String srpResourcePath, final ResourceResolver resolver,
        final SocialResourceUtilities socialUtils, final SocialResourceProvider srp, int offset, int size) {
        this.resolver = resolver;
        this.srp = srp;
        this.socialUtils = socialUtils;
        srpResource = srp.getResource(resolver, srpResourcePath);
        if(srpResource == null) {
            throw new ResourceNotFoundException(srpResourcePath + " does not exist");
        }
        count = srp.countChildren(srpResource);
        List<Entry<String, Boolean>> sortBy = new ArrayList<Entry<String, Boolean>>();
        children = buildChildren(srp.listChildren(srpResourcePath, resolver, offset, size, sortBy));
    }
    
    public SRPResourceImpl(final String srpResourcePath, final ResourceResolver resolver,
            final SocialResourceUtilities socialUtils, final SocialResourceProvider srp) {
            this.resolver = resolver;
            this.srp = srp;
            this.socialUtils = socialUtils;
            srpResource = srp.getResource(resolver, srpResourcePath);
            if(srpResource == null) {
                throw new ResourceNotFoundException(srpResourcePath + " does not exist");
            }
            count = srp.countChildren(srpResource);
            List<Entry<String, Boolean>> sortBy = new ArrayList<Entry<String, Boolean>>();

            children = buildChildren(srp.listChildren(srpResource));
        }

    public SRPResourceImpl(final String srpResourcePath, boolean shallow, final SocialResourceProvider srp,
        final ResourceResolver resolver, final SocialResourceUtilities socialUtils) {
        this.resolver = resolver;
        this.srp = srp;
        this.socialUtils = socialUtils;
        srpResource = srp.getResource(resolver, srpResourcePath);
        if(srpResource == null) {
            throw new ResourceNotFoundException(srpResourcePath + " does not exist");
        }
        children = shallow ? Collections.<SRPResource>emptyList() : buildChildren(srp.listChildren(srpResource));
        count = shallow ? 0 : srp.countChildren(srpResource);
    }

    public SRPResourceImpl(Resource resource, boolean shallow, SocialResourceProvider srp, ResourceResolver resolver,
        SocialResourceUtilities socialUtils) {
        this.resolver = resolver;
        this.srp = srp;
        this.socialUtils = socialUtils;
        srpResource = resource;
        children = shallow ? Collections.<SRPResource>emptyList() : buildChildren(srp.listChildren(srpResource));
        count = shallow ? 0 : srp.countChildren(srpResource);
    }

    private List<SRPResource> buildChildren(Iterator<Resource> listChildren) {
        List<SRPResource> children = new ArrayList<SRPResource>();
        while (listChildren.hasNext()) {
            final Resource child = listChildren.next();
            children.add(new SRPResourceImpl(child, true, srp, resolver, socialUtils));
        }
        return children;
    }

    public boolean getHasChildren() {
        return count > 0;
    }

    public List<SRPResource> getChildren() {
        return children;
    }

    public Map<String, Property> getProperties() {
        final ValueMap vm = srpResource.adaptTo(ValueMap.class);
        final Map<String, Property> props = new HashMap<String, Property>(10);
        for (final String key : vm.keySet()) {
            final Object val = vm.get(key);
            props.put(key, new Property() {

                public Object getValue() {
                    return val;
                }

                public Type getType() {
                    return Type.fromObjectType(val.getClass().getSimpleName());
                }

                public String getName() {
                    return key;
                }
            });
        }
        return props;
    }

    public String getParent() {
        final Resource parent = srpResource.getParent();
        return parent == null ? null : parent.getPath();
    }

    public String getContentComponent() {
        final Resource jcrResource = ((SocialResource) srpResource).getRootJCRNode();
        return jcrResource == null ? null : jcrResource.getPath();
    }

    public String getPath() {
        return srpResource.getPath();
    }

}
