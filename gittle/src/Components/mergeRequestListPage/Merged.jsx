import React from "react";
import { Octokit } from "octokit";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { mergedRequests, mergeRequest, mergeCommit } from "../../atoms";
import styles from "./Merged.module.css";
import { useNavigate } from "react-router-dom";

export default function Merged() {
  const [mergedReq, setMergedReq] = useRecoilState(mergedRequests);
  const [detail, setDetail] = useRecoilState(mergeRequest);
  const [commits, setCommits] = useRecoilState(mergeCommit);
  const user = localStorage.getItem("userInfo");
  const location = localStorage.getItem("currentRepo");
  const repoArr = location.split("\\");
  const repo = repoArr[repoArr.length - 1];
  const navigate = useNavigate();

  useEffect(() => {
    async function getRequest() {
      const octokit = new Octokit({
        auth: "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",
      });

      const result = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
        owner: user,
        repo: repo,
        state: "closed",
      });

      console.log("닫힘", result.data);
      setMergedReq(result.data);
    }
    getRequest();
  }, []);

  const reqDetail = async (number) => {
    const result = await showRequest(number);
    navigate("/merge/detail");
  };

  async function showRequest(number) {
    const user = localStorage.getItem("userInfo");
    const location = localStorage.getItem("currentRepo").split("\\");
    console.log(location);
    const repo = location[location.length - 1];

    const octokit = new Octokit({
      auth: "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",
    });

    const info = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner: user,
        repo: repo,
        pull_number: number,
      }
    );

    const commit = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
      {
        owner: user,
        repo: repo,
        pull_number: number,
      }
    );
    console.log(info.data);
    console.log(commit);

    setDetail(info.data);
    setCommits(commit.data);
  }

  return (
    <>
      <div>
        {mergedReq.map((req, index) => (
          <div
            key={index}
            className={styles.box}
            onClick={() => reqDetail(req.number)}
          >
            <div className={styles.title}>{req.title}</div>
            <div className={styles.body}>
              <div className={styles.person}>요청자</div>
              <img
                className={styles.image}
                src={req.user.avatar_url}
                alt="avatar"
              />
              <div className={styles.text}>{req.user.login}</div>
              <div className={styles.text}>|</div>
              <div className={styles.person}>담당자</div>
              <img
                className={styles.image}
                src={req.assignee.avatar_url}
                alt="avatar"
              />

              <div className={styles.text}>{req.assignee.login}</div>
              <div className={styles.text}>|</div>
              <div className={styles.text}>
                {req.merged_at.replace("T", " ").replace("Z", "")} 에 merge 완료
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
