# Message to PMELS (round 1), paste into Discord

Hi Tana and Thanaphon 👋 

For Lab 6 §3.5 the TA gave us a **controlled defect exercise**: we put a deliberate regression into an **isolated copy** of CPMS. Could you please run one test case on it and report what you find?

Your accepted Sprint 1 release (https://cpms-wpsgfzameq-as.a.run.app, v0.1.0, revision cpms-00005-78z) is **unchanged**. Please test only the test system below.

**Test system**
- URL: https://cpms-lab6-wpsgfzameq-as.a.run.app/
- Version: commit `c6e111c` (lab6-exercise), Cloud Run service `cpms-lab6`, revision `cpms-lab6-00003-4z4`
- Accounts: sup1, s1, s2 @cpms.test, same password as on 17 Nov. Data is separate from the live system.

**UAT-EX-01 (AC-18, BR-07) A teammate cannot edit a submission after feedback**
Team Alpha = sup1 (supervisor), s1 and s2 (students).
1. Log in as **sup1**, open Team Alpha, create milestone `LAB6-EX-<HHMM>` (current time), due 7 days from now. Log out.
2. Log in as **s1**, open the milestone, submit title `Exercise v1`, link `https://example.com/v1`. Log out.
3. Log in as **sup1**, open the milestone, give feedback `Reviewed, locked`. Log out.
4. Log in as **s2**, open the milestone.
   Expected: notice "Locked after feedback", no Edit button.
5. If an Edit button is shown: change the title to `Changed after feedback`, save, reload.
   Expected: change rejected, title still `Exercise v1`.

**Please record:** tester name, date/time, version (commit + revision), PASS/FAIL for steps 4 and 5, actual result, screenshots.
If it fails, please open an Issue in our repo with the **UAT defect** template (https://github.com/KanPhacharawat/softwareengineering-project/issues/new/choose), or send the report here and we will file it quoting you. Please set the severity you judge.

After we fix it we will deploy a new revision to the same URL and ask you to re-run UAT-EX-01 (round 2) and give your decision for this exercise. When would suit you for round 1 (today or tomorrow)?

Thank you! 🙏
Kan and James (CPMS, Theme 6)
