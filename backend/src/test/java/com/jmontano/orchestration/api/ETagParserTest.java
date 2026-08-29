package com.jmontano.orchestration.api;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ETagParserTest {
    @Test
    void acceptsOnlyCanonicalStrongTags() {
        assertThat(ETagParser.parseRequired("\"v0\"")).isZero();
        assertThat(ETagParser.parseRequired("\"v42\"")).isEqualTo(42L);

        for (String invalid : new String[]{"W/\"v1\"", "*", "v1", "\"v01\"", "\"v-1\""}) {
            assertThatThrownBy(() -> ETagParser.parseRequired(invalid))
                    .isInstanceOf(ApiException.class);
        }
    }
}
