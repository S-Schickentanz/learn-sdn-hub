import { Router, Request } from "express";
import P4Environment from "../P4Environment";
import bodyParser from "body-parser";
import environments from "../Configuration";
import { InstanceProvider } from "../providers/Provider";
import { Persister } from "../database/Persister";
import fs from "fs";
import path from "path";
import authenticationMiddleware, {
  RequestWithUser,
} from "../authentication/AuthenticationMiddleware";

const markdown = fs
  .readFileSync(path.resolve(__dirname, "../assignments/p4basic.md"))
  .toString();

export default (persister: Persister, provider: InstanceProvider): Router => {
  const router = Router();

  router.get("/:environment/configuration", (req: Request, res) => {
    const environment = req.params.environment;
    const targetEnv = environments.get(String(environment));
    console.log("/:environment/configuration");
    if (targetEnv === undefined) {
      return res
        .status(404)
        .json({ error: true, message: "Environment not found" });
    }
    return res.status(200).json({
      files: targetEnv.editableFiles.map((file) => file.alias),
      ttys: targetEnv.tasks
        .filter((task) => task.provideTty === true)
        .map((task) => task.name),
    });
  });

  router.get("/:environment/assignment", (req, res) => {
    res.send(markdown);
  });

  router.post(
    "/create",
    authenticationMiddleware,
    (req: RequestWithUser, res) => {
      console.log("HERE", req.user);
      const environment = req.query.environment;
      const targetEnv = environments.get(String(environment));
      if (targetEnv === undefined) {
        return res
          .status(404)
          .json({ error: true, message: "Environment not found" });
      }
      P4Environment.createEnvironment(
        req.user.username,
        String(environment),
        targetEnv,
        provider,
        persister
      )
        .then(() => {
          res.status(200).json();
        })
        .catch((err: Error) => {
          console.log(err);
          res.status(200).json({ status: "error", message: err.message });
        });
    }
  );

  router.get(
    "/:environment/file/:alias",
    authenticationMiddleware,
    (req, res) => {
      const env = P4Environment.getActiveEnvironment(req.params.environment);
      env
        .readFile(req.params.alias)
        .then((content: string) => {
          res.status(200).end(content);
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: true, message: err.message });
        });
    }
  );

  router.post(
    "/:environment/file/:alias",
    bodyParser.text({ type: "text/plain" }),
    authenticationMiddleware,
    (req, res) => {
      const env = P4Environment.getActiveEnvironment(req.params.environment);
      console.log("body:", req.body);
      env
        .writeFile(req.params.alias, req.body)
        .then(() => res.status(200).end())
        .catch((err: Error) =>
          res.status(400).json({ status: "error", message: err.message })
        );
    }
  );

  router.post("/:environment/restart", authenticationMiddleware, (req, res) => {
    const env = P4Environment.getActiveEnvironment(req.params.environment);
    env
      .restart()
      .then(() => {
        res
          .status(200)
          .json({ status: "finished", message: "Restart complete" });
      })
      .catch((err) =>
        res.status(400).json({ status: "error", message: err.message })
      );
  });

  return router;
};
