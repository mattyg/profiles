import { Orchestrator, Config } from "@holochain/tryorama";

const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const orchestrator = new Orchestrator();

export const simpleConfig = {
  alice: Config.dna("../profiles.dna.gz", null),
  bobbo: Config.dna("../profiles.dna.gz", null),
};


orchestrator.registerScenario(
  "create and get a calendar event",
  async (s, t) => {
    const { conductor } = await s.players({
      conductor: Config.gen(simpleConfig),
    });
    await conductor.spawn();

    let calendarEventHash = await conductor.call(
      "alice",
      "profiles",
      "create_calendar_event",
      {
        title: "Event 1",
        start_time: [Math.floor(Date.now() / 1000), 0],
        end_time: [Math.floor(Date.now() / 1000) + 1000, 0],
        location: { Custom: "hiii" },
        invitees: [],
      }
    );
    t.ok(calendarEventHash);

    await sleep(10);

    let calendarEvents = await conductor.call(
      "bobbo",
      "profiles",
      "get_all_profiles",
      null
    );
    t.equal(calendarEvents.length, 1);
  }
);

orchestrator.run();