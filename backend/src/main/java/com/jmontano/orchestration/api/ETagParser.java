package com.jmontano.orchestration.api;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ETagParser {
    private static final Pattern STRONG_VERSION = Pattern.compile("\\\"v(0|[1-9][0-9]*)\\\"");

    private ETagParser() {
    }

    public static long parseRequired(String value) {
        if (value == null || value.isBlank()) {
            throw ApiException.preconditionRequired();
        }
        Matcher matcher = STRONG_VERSION.matcher(value);
        if (!matcher.matches()) {
            throw ApiException.badRequest("INVALID_ETAG", "If-Match debe usar el formato fuerte \"v<n>\"");
        }
        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException exception) {
            throw ApiException.badRequest("INVALID_ETAG", "La versión excede el rango admitido");
        }
    }

    public static String fromVersion(long version) {
        return "\"v" + version + "\"";
    }
}
