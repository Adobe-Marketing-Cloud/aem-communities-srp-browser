/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
package com.adobe.aem.social.srp.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.Charset;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceNotFoundException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobe.aem.social.srp.api.ResourceBrowser;
import com.adobe.aem.social.srp.api.SRPResource;
import com.adobe.cq.social.scf.JsonException;
import com.adobe.cq.social.srp.utilities.api.SocialResourceUtilities;
import com.fasterxml.jackson.core.JsonEncoding;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

/**
 * This servlet serves all GET requests to .srp.json.
 */
@Component
@Service(value = javax.servlet.Servlet.class)
@Properties({
    @Property(name = "sling.servlet.resourceTypes", value = {"sling/servlet/default"}, propertyPrivate = true),
    @Property(name = "sling.servlet.methods", value = {HttpConstants.METHOD_GET}, propertyPrivate = true),
    @Property(name = "sling.servlet.selectors", value = {SRPServlet.SRP_SELECTOR}, propertyPrivate = false),
    @Property(name = "sling.servlet.extensions", value = {"json"}, propertyPrivate = false)})
public class SRPServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = -4801181001386798731L;

    protected static final String CONTENT_TYPE = "application/json";

    protected static final String ENCODING = "utf-8";
    protected static final Boolean DEFAULT_TIDY = Boolean.FALSE;

    protected static final String SRP_SELECTOR = "srp";

    private static final Logger LOG = LoggerFactory.getLogger(SRPServlet.class);

    private static final String TIDY = "tidy";

    @Reference
    private SocialResourceUtilities socialUtils;

    @Reference
    private ResourceBrowser browser;

    private static ObjectMapper objectMapper;

    static {
        objectMapper = new ObjectMapper();
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, true).configure(
            SerializationFeature.WRAP_EXCEPTIONS, false);
    }

    @Override
    protected final void doPost(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
        throws ServletException, IOException {
        this.handleMethodNotImplemented(request, response);
    }

    @Override
    protected final void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
        throws ServletException, IOException {

        final String requestedPath = request.getParameter("path");
        
        final String off = request.getParameter("offset");
        final String si = request.getParameter("size");
        // TODO: check if is SRP 
        final ResourceResolver resolver = request.getResourceResolver();
        final Resource resource = resolver.resolve(requestedPath);
        String componentResourcePath = socialUtils.ugcToResourcePath(resource);
        final Resource resource1 = resolver.resolve(componentResourcePath );
        final String resourceType = resource1.getResourceType();
        if (off != null && si != null && resourceType.startsWith("social")) {
            final int offset = Integer.parseInt(off);
            final int size = Integer.parseInt(si);       
            
            final boolean tidy =
                request.getParameter(TIDY) != null ? Boolean.parseBoolean(request.getParameter(TIDY)) : DEFAULT_TIDY;
            
            final SRPResource res = browser.getResourcesForComponent(requestedPath, resolver, offset, size);
            this.sendResponse(res, response, request, tidy);
        }
        else {
            final boolean tidy =
                request.getParameter(TIDY) != null ? Boolean.parseBoolean(request.getParameter(TIDY)) : DEFAULT_TIDY;

            final SRPResource res = browser.getResourcesForComponent(requestedPath, resolver);
            this.sendResponse(res, response, request, tidy);
            
        }
    }

    private void sendResponse(final SRPResource resource, final SlingHttpServletResponse response,
        final SlingHttpServletRequest request, final boolean tidy) throws IOException {
        this.setResponseHeaders(response, request);
        try {
            this.writeResponse(resource, response, request, tidy);
        } catch (final JsonException e) {
            LOG.error("Could not write JSON response for resource: {}", resource.getPath(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            throw e;
        }
    }

    protected void writeResponse(final SRPResource resource, final SlingHttpServletResponse response,
        final SlingHttpServletRequest request, final boolean tidy) throws JsonException, IOException {
        final String jsonData = toJSONString(resource, tidy);
        if (StringUtils.isEmpty(jsonData)) {
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        response.getWriter().write(jsonData);
    }

    private String toJSONString(final SRPResource resource, final boolean tidy) throws JsonException {
        try {
            final JsonFactory f = new JsonFactory();
            final ByteArrayOutputStream bastream = new ByteArrayOutputStream();
            final JsonGenerator jgen = f.createGenerator(bastream, JsonEncoding.UTF8);
            if (tidy) {
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(jgen, resource);
            } else {
                objectMapper.writeValue(jgen, resource);
            }
            return new String(bastream.toByteArray(), Charset.forName("UTF-8"));
        } catch (final JsonProcessingException e) {
            throw new JsonException("Error converting " + resource.getPath() + " to JSON", e);
        } catch (final IOException e) {
            throw new JsonException("Error converting " + resource.getPath() + " to JSON", e);
        }
    }

    protected void setResponseHeaders(final SlingHttpServletResponse response, final SlingHttpServletRequest request) {
        response.setContentType(CONTENT_TYPE);
        response.setCharacterEncoding(ENCODING);
    }

}
