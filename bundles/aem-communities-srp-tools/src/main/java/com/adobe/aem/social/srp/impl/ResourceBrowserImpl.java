package com.adobe.aem.social.srp.impl;

import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;

import com.adobe.aem.social.srp.api.ResourceBrowser;
import com.adobe.aem.social.srp.api.SRPResource;
import com.adobe.cq.social.srp.SocialResourceProvider;
import com.adobe.cq.social.srp.utilities.api.SocialResourceUtilities;

@Service
@Component
public class ResourceBrowserImpl implements ResourceBrowser {

	@Reference
	SocialResourceUtilities socialUtils;
	

	public SRPResource getResourcesForComponent(String contentComponentPath,
			ResourceResolver resolver) {
		final Resource componentResource = resolver
				.getResource(contentComponentPath);
		final String ugcResourcePath = socialUtils
				.resourceToUGCStoragePath(componentResource);
		final SocialResourceProvider srp = socialUtils
				.getSocialResourceProvider(componentResource);
		srp.setConfig(socialUtils.getStorageConfig(componentResource));
		return new SRPResourceImpl(ugcResourcePath, resolver, socialUtils, srp);
	}

	public SRPResource getUGCResource(String ugcPath, ResourceResolver resolver) {
		return null;
	}

}
