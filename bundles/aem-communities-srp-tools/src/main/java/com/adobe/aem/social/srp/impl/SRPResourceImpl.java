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
import com.adobe.cq.social.ugcbase.core.SocialResourceUtils;
import com.adobe.cq.social.ugcbase.SocialUtils;

public class SRPResourceImpl implements SRPResource {

    private Resource srpResource;
    private Resource requestResource;
    private final long count;
    private final List<SRPResource> children;
    private final ResourceResolver resolver;
    private final SocialResourceUtilities socialUtils;
    private final SocialResourceProvider srp;
    private final List<SRPResource> contentChildren;

    public SRPResourceImpl(final String srpResourcePath, final ResourceResolver resolver,
        final SocialResourceUtilities socialUtils, final SocialResourceProvider srp, int offset, int size) {
        this.resolver = resolver;
        this.srp = srp;
        this.socialUtils = socialUtils;
        this.requestResource = resolver.resolve(srpResourcePath);
        srpResource = getResource(srp, resolver, srpResourcePath);
        if (srpResource == null) {
            throw new ResourceNotFoundException(srpResourcePath + " does not exist");
        }

        String componentResourcePath = socialUtils.ugcToResourcePath(srpResource);

        count = srp.countChildren(srpResource);

        List<Entry<String, Boolean>> sortBy = new ArrayList<Entry<String, Boolean>>();
        children = buildChildren(srp.listChildren(componentResourcePath, resolver, offset, size, sortBy));
        contentChildren =
            requestResource instanceof SocialResource ? Collections.<SRPResource>emptyList()
                : buildContentChildren(requestResource);
    }

    public SRPResourceImpl(final String srpResourcePath, final ResourceResolver resolver,
        final SocialResourceUtilities socialUtils, final SocialResourceProvider srp) {
        this.resolver = resolver;
        this.srp = srp;
        this.socialUtils = socialUtils;
        srpResource = getResource(srp, resolver, srpResourcePath);
        this.requestResource = resolver.resolve(srpResourcePath);

        if (srpResource == null) {
            throw new ResourceNotFoundException(srpResourcePath + " does not exist");
        }
        count = srp.countChildren(srpResource);

        children = buildChildren(srp.listChildren(srpResource));
        contentChildren =
            requestResource instanceof SocialResource ? Collections.<SRPResource>emptyList()
                : buildContentChildren(requestResource);
    }

    private List<SRPResource> buildContentChildren(Resource resource) {
        Iterable<Resource> children = resource.getChildren();
        List<SRPResource> childResources = new ArrayList<SRPResource>(10);
        for (final Resource child : children) {
            childResources.add(new SRPResourceImpl(child, true, srp, resolver, socialUtils));
        }
        return childResources;
    }

    private Resource getResource(SocialResourceProvider srp2, ResourceResolver resolver2, String srpResourcePath) {
        final Resource resource = srp.getResource(resolver, srpResourcePath);
        return resource == null ? resolver.resolve(socialUtils.ugcToResourcePath(srpResourcePath)) : resource;
    }

    public SRPResourceImpl(final String srpResourcePath, boolean shallow, final SocialResourceProvider srp,
        final ResourceResolver resolver, final SocialResourceUtilities socialUtils) {
        this.resolver = resolver;
        this.srp = srp;
        this.socialUtils = socialUtils;
        srpResource = getResource(srp, resolver, srpResourcePath);
        this.requestResource = resolver.resolve(srpResourcePath);
        if (srpResource == null) {
            throw new ResourceNotFoundException(srpResourcePath + " does not exist");
        }
        children = shallow ? Collections.<SRPResource>emptyList() : buildChildren(srp.listChildren(srpResource));
        count = shallow ? 0 : srp.countChildren(srpResource);
        contentChildren =
            shallow || requestResource instanceof SocialResource  ? Collections.<SRPResource>emptyList()
                : buildContentChildren(requestResource);
    }

    public SRPResourceImpl(Resource resource, boolean shallow, SocialResourceProvider srp, ResourceResolver resolver,
        SocialResourceUtilities socialUtils) {
        this.resolver = resolver;
        this.srp = srp;
        this.socialUtils = socialUtils;
        srpResource = resource;
        this.requestResource = resource;
        children = shallow ? Collections.<SRPResource>emptyList() : buildChildren(srp.listChildren(srpResource));
        count = shallow ? 0 : srp.countChildren(srpResource);
        contentChildren =
            shallow || requestResource instanceof SocialResource  ? Collections.<SRPResource>emptyList()
                : buildContentChildren(requestResource);
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
        final Resource jcrResource =
            srpResource instanceof SocialResource ? ((SocialResource) srpResource).getRootJCRNode() : srpResource;
        return jcrResource == null ? null : jcrResource.getPath();
    }

    public String getPath() {
        return srpResource.getPath();
    }

    public List<SRPResource> getContentChildren() {
        return contentChildren;
    }

}
