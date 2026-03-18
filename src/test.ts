import * as gatus from ".";

const conditions: gatus.Condition[] = [
    gatus.makeCondition("slow worker", async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return true;
    }),
    gatus.makeCondition("bad worker", async () => false),
    gatus.makeCondition("exceptional worker", async () => {
        throw new Error("oops");
    }),
];

gatus.start("localhost", "private-services_test", "hello", conditions, 10 * 1000);
