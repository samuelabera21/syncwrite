"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permission_middleware_1 = require("../src/middleware/permission.middleware");
function assert(condition, msg) {
    if (!condition) {
        throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`✓ ${msg}`);
}
console.log("=== Testing Role Hierarchy and Minimum Role Evaluation ===");
// OWNER permissions
assert((0, permission_middleware_1.hasMinimumRole)("OWNER", "OWNER") === true, "Owner satisfies Owner role");
assert((0, permission_middleware_1.hasMinimumRole)("OWNER", "EDITOR") === true, "Owner satisfies Editor role");
assert((0, permission_middleware_1.hasMinimumRole)("OWNER", "COMMENTER") === true, "Owner satisfies Commenter role");
assert((0, permission_middleware_1.hasMinimumRole)("OWNER", "VIEWER") === true, "Owner satisfies Viewer role");
// EDITOR permissions
assert((0, permission_middleware_1.hasMinimumRole)("EDITOR", "OWNER") === false, "Editor does not satisfy Owner role");
assert((0, permission_middleware_1.hasMinimumRole)("EDITOR", "EDITOR") === true, "Editor satisfies Editor role");
assert((0, permission_middleware_1.hasMinimumRole)("EDITOR", "COMMENTER") === true, "Editor satisfies Commenter role");
assert((0, permission_middleware_1.hasMinimumRole)("EDITOR", "VIEWER") === true, "Editor satisfies Viewer role");
// COMMENTER permissions
assert((0, permission_middleware_1.hasMinimumRole)("COMMENTER", "OWNER") === false, "Commenter does not satisfy Owner role");
assert((0, permission_middleware_1.hasMinimumRole)("COMMENTER", "EDITOR") === false, "Commenter does not satisfy Editor role");
assert((0, permission_middleware_1.hasMinimumRole)("COMMENTER", "COMMENTER") === true, "Commenter satisfies Commenter role");
assert((0, permission_middleware_1.hasMinimumRole)("COMMENTER", "VIEWER") === true, "Commenter satisfies Viewer role");
// VIEWER permissions
assert((0, permission_middleware_1.hasMinimumRole)("VIEWER", "OWNER") === false, "Viewer does not satisfy Owner role");
assert((0, permission_middleware_1.hasMinimumRole)("VIEWER", "EDITOR") === false, "Viewer does not satisfy Editor role");
assert((0, permission_middleware_1.hasMinimumRole)("VIEWER", "COMMENTER") === false, "Viewer does not satisfy Commenter role");
assert((0, permission_middleware_1.hasMinimumRole)("VIEWER", "VIEWER") === true, "Viewer satisfies Viewer role");
// NONE permissions
assert((0, permission_middleware_1.hasMinimumRole)("NONE", "VIEWER") === false, "None does not satisfy Viewer role");
assert((0, permission_middleware_1.hasMinimumRole)("NONE", "COMMENTER") === false, "None does not satisfy Commenter role");
assert((0, permission_middleware_1.hasMinimumRole)("NONE", "EDITOR") === false, "None does not satisfy Editor role");
assert((0, permission_middleware_1.hasMinimumRole)("NONE", "OWNER") === false, "None does not satisfy Owner role");
console.log("\nAll 16 permission hierarchy assertions passed successfully!");
