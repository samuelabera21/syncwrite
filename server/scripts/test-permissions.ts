import { hasMinimumRole, ROLE_HIERARCHY, EffectiveRole } from "../src/middleware/permission.middleware";

function assert(condition: boolean, msg: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`✓ ${msg}`);
}

console.log("=== Testing Role Hierarchy and Minimum Role Evaluation ===");

// OWNER permissions
assert(hasMinimumRole("OWNER", "OWNER") === true, "Owner satisfies Owner role");
assert(hasMinimumRole("OWNER", "EDITOR") === true, "Owner satisfies Editor role");
assert(hasMinimumRole("OWNER", "COMMENTER") === true, "Owner satisfies Commenter role");
assert(hasMinimumRole("OWNER", "VIEWER") === true, "Owner satisfies Viewer role");

// EDITOR permissions
assert(hasMinimumRole("EDITOR", "OWNER") === false, "Editor does not satisfy Owner role");
assert(hasMinimumRole("EDITOR", "EDITOR") === true, "Editor satisfies Editor role");
assert(hasMinimumRole("EDITOR", "COMMENTER") === true, "Editor satisfies Commenter role");
assert(hasMinimumRole("EDITOR", "VIEWER") === true, "Editor satisfies Viewer role");

// COMMENTER permissions
assert(hasMinimumRole("COMMENTER", "OWNER") === false, "Commenter does not satisfy Owner role");
assert(hasMinimumRole("COMMENTER", "EDITOR") === false, "Commenter does not satisfy Editor role");
assert(hasMinimumRole("COMMENTER", "COMMENTER") === true, "Commenter satisfies Commenter role");
assert(hasMinimumRole("COMMENTER", "VIEWER") === true, "Commenter satisfies Viewer role");

// VIEWER permissions
assert(hasMinimumRole("VIEWER", "OWNER") === false, "Viewer does not satisfy Owner role");
assert(hasMinimumRole("VIEWER", "EDITOR") === false, "Viewer does not satisfy Editor role");
assert(hasMinimumRole("VIEWER", "COMMENTER") === false, "Viewer does not satisfy Commenter role");
assert(hasMinimumRole("VIEWER", "VIEWER") === true, "Viewer satisfies Viewer role");

// NONE permissions
assert(hasMinimumRole("NONE", "VIEWER") === false, "None does not satisfy Viewer role");
assert(hasMinimumRole("NONE", "COMMENTER") === false, "None does not satisfy Commenter role");
assert(hasMinimumRole("NONE", "EDITOR") === false, "None does not satisfy Editor role");
assert(hasMinimumRole("NONE", "OWNER") === false, "None does not satisfy Owner role");

console.log("\nAll 16 permission hierarchy assertions passed successfully!");
