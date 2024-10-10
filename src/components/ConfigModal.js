import { Modal, Checkbox, Input, notification } from "antd";
import { useState, useEffect, createContext } from "react";
import useLocationStorage from "../hooks/useLocationStorage";
import _ from "lodash";

const TAG = 'CONFIG'

const ConfigModal = ({ open = false, onClose = () => { } }) => {
    const storage = useLocationStorage()
	const [configState, setConfigState] = useState({});
	const updateConfigState = (newState) =>
        setConfigState((prev) => ({ ...prev, ...newState }));
    
    useEffect(() => {
        if (!_.isEqual({}, configState))
        storage.set(TAG, configState)
    }, [configState])

    const loadData = () => {
        const config = storage.get(TAG) || {};
        updateConfigState(config)
    }

	useEffect(() => {
        if (!open) return;
        
        loadData()
	}, [open]);

	return (
		<>
			<Modal
				title="個人設置"
				open={open}
				onCancel={onClose}
				// onOk={handleSubmit}
				footer={[]}
			>
				<p>
					<Checkbox
						checked={configState.discordBotEnabled}
						onChange={(e) => {
							updateConfigState({
								discordBotEnabled: e.target.checked,
							});
						}}
					>
						Discord 機器人提醒
					</Checkbox>
				</p>
				<p>
					Discord 頻道ID
					<Input
						value={configState.channelId}
						onChange={(e) => {
							updateConfigState({
								channelId: e.target.value,
							});
						}}
					/>
				</p>
				<p>
					Discord 機器人授權
					<br />
					<a href="https://discord.com/oauth2/authorize?client_id=1290530480915222548">
						https://discord.com/oauth2/authorize?client_id=1290530480915222548
					</a>
				</p>
			</Modal>
		</>
	);
};

export default ConfigModal;
