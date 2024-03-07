import {afterEach, vi} from "vitest";
import {ui} from "@code-pushup/utils";

afterEach(() => {
   ui().logger.flushLogs();
})
