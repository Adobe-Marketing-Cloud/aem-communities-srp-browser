package com.adobe.aem.social.srp.api;

public interface Property {
    String getName();

    Object getValue();

    Type getType();

    enum Type {
        STRING, BOOLEAN, DATE, MULTI, NUMBER;

        public static Type fromObjectType(final String name) {
            if ("String".equalsIgnoreCase(name)) {
                return STRING;
            }
            if ("GregorianCalendar".equalsIgnoreCase(name)) {
                return DATE;
            }
            if ("Boolean".equalsIgnoreCase(name)) {
                return BOOLEAN;
            }
            if ("Long".equalsIgnoreCase(name)) {
                return NUMBER;
            }
            return STRING;
        }
    }
}
