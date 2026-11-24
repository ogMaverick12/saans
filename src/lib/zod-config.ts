import { z } from "zod";

/**
 * Disables Zod's eval-based JIT so strict CSPs never report its feature probe.
 */
z.config({ jitless: true });
