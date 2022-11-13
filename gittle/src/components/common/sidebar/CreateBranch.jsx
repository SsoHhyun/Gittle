import React, { useState } from "react";
import Button from "../Button";
import Modal from "../Modal";
import styles from "./CreateBranch.module.css";

function CreateBranch() {
  const [modalOpen, setModalOpen] = useState(false);
  const [newBranches, setNewBranches] = useState("");

  const { ipcRenderer } = window.require("electron");

  const createNewBranches = (newBranch) => {
    ipcRenderer.sendSync(
      "create branch",
      localStorage.getItem("currentRepo"),
      newBranch
    );
  };

  const openModal = () => {
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  const onChangeHandler = (e) => {
    setNewBranches(e.target.value);
  };

  const branchCreator = (e) => {
    e.preventDefault();
    if (newBranches.trim().length === 0) return;
    createNewBranches(newBranches);
    setNewBranches("");
    closeModal();
  };

  return (
    <>
      <Button
        action={openModal}
        content={"새 branch"}
        style={{ backgroundColor: "#6BCC78" }}
      />

      <Modal
        open={modalOpen}
        content={
          <>
            <form onSubmit={branchCreator}>
              <div>
                <label>이름</label>
                <input
                  required
                  type="text"
                  value={newBranches}
                  className={styles.input}
                  onChange={onChangeHandler}
                />
              </div>

              <div>
                <label>상위 브랜치</label>
                {/* <BranchSelector /> */}
              </div>
              <div className={styles.buttonContainer}>
                <Button
                  content={"branch 생성"}
                  style={{ backgroundColor: "#6BCC78" }}
                />
                <Button
                  action={closeModal}
                  content={"취소"}
                  style={{ border: "1px solid #7B7B7B" }}
                />
              </div>
            </form>
          </>
        }
      ></Modal>
    </>
  );
}

export default CreateBranch;