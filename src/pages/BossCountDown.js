import { useEffect, useState } from "react";
import { Button, TimePicker, Table, Checkbox, Modal, Input } from "antd";
import moment from "moment-timezone";
import axios from "axios";
import {
	FormOutlined,
	CheckOutlined,
	CloseOutlined,
	SettingOutlined,
} from "@ant-design/icons";
import useLocationStorage from "../hooks/useLocationStorage";
import ConfigModal from "../components/ConfigModal";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TAG = "BOSS";

const BossCountDown = () => {
	const storage = useLocationStorage();

	const NEXT_SPAWN_TIME_OFFSET = 60 * 59 + 55; // 59 mins 55 secs

	const initTableData = () => {
		const _tableData = [];
		for (let i = 0; i < 24; i++) {
			let serverName = "";
			if (i < 8) {
				serverName = `龍${(i % 8) + 1}`;
			} else if (i < 16) {
				serverName = `樹${(i % 8) + 1}`;
			} else if (i < 24) {
				serverName = `火山${(i % 8) + 1}`;
			}
			_tableData.push({
				key: i,
				serverId: i + 1,
				serverName,
				isRunning: false,
				isUpdateMode: false,
				killTime: undefined,
				lastKillTime: undefined,
			});
		}
		return _tableData;
	};

	const [isLoading, setIsLoading] = useState(true);
	const [count, setCount] = useState(0);
	const [tableData, setTableData] = useState([]);
	const [configState, setConfigState] = useState(
		storage.get("configState") || {}
	);
	const [timeLeftMap, setTimeLeftMap] = useState({});

	const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
	const showConfigModal = () => setIsConfigModalOpen(true);
	const closeConfigModal = () => setIsConfigModalOpen(false);

	const convertToHMS = (timeleft) => {
		if (!timeleft) return null;
		return [
			Math.floor(timeleft / 60 / 60),
			Math.floor((timeleft % 3600) / 60),
			timeleft % 60,
		];
	};

	useEffect(() => {
		const interval = setInterval(() => {
			setCount((prev) => {
				if (prev > 500) return;
				return prev + 1;
			});
			calculateNextSpawnTimeLeft();
		}, 1000);
		return () => clearInterval(interval);
	}, [count]);

	const sendDiscordMessage = async (param) => {
		const config = storage.get("CONFIG") || {};

		if (!config.discordBotEnabled) return false;
		if (!config.channelId) return false;

		const { message, channelId, serverName, lastKillTime, spawnTime } =
			param;

		try {
			await axios(
				`https://api.botghost.com/webhook/1290530480915222548/5feg5sgffzpkrbu90ev13a`,
				{
					method: "POST",
					headers: {
						authorization:
							"74e962253b81bf0f536cfebfa57dacaf0db93a1629116e9098786a27d8da2df7",
					},
					data: {
						variables: [
							{
								name: "message",
								variable: "{message}",
								value: message,
							},
							{
								name: "channelId",
								variable: "{channelId}",
								value: channelId,
							},
							{
								name: "serverName",
								variable: "{serverName}",
								value: serverName,
							},
							{
								name: "lastKillTime",
								variable: "{lastKillTime}",
								value: lastKillTime,
							},
							{
								name: "spawnTime",
								variable: "{spawnTime}",
								value: spawnTime,
							},
						],
					},
				}
			);
			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	};

	const calculateNextSpawnTimeLeft = async () => {
		for (const dataIndex in tableData) {
			const { lastKillTime, serverId, msgSentAt2Mins, Require2MinsMsg } =
				tableData[dataIndex];

			if (lastKillTime == -1) continue;
			if (
				moment(lastKillTime)
					.add(NEXT_SPAWN_TIME_OFFSET, "seconds")
					.isBefore(moment())
			) {
				const tf = timeLeftMap[serverId];
				if (tf != 0) {
					setTimeLeftMap((prev) => ({
						...prev,
						[serverId]: 0,
					}));
				}
				continue;
			}
			const timeleft = moment(lastKillTime)
				.add(NEXT_SPAWN_TIME_OFFSET, "seconds")
                .diff(moment(), "second");
            
			setTimeLeftMap((prev) => ({
				...prev,
				[serverId]: timeleft,
			}));

			if (timeleft === 60 * 2 && !msgSentAt2Mins && Require2MinsMsg) {
				tableData[dataIndex].msgSentAt2Mins = true;

				const result = await sendDiscordMessage({
					channelId: configState.channelId,
					lastKillTime: moment(lastKillTime).format(
						"YYYY-MM-DD HH:mm:ss"
					),
					spawnTime: moment(lastKillTime)
						.add(NEXT_SPAWN_TIME_OFFSET, "seconds")
						.format("YYYY-MM-DD HH:mm:ss"),
					serverName: tableData[dataIndex].serverName,
					message: `世界BOSS將於2分鐘後在${tableData[dataIndex].serverName}出現`,
				});
				if (!result) {
					tableData[dataIndex].msgSentAt2Mins = false;
				}
			}

			if (timeleft === 20 && !tableData[dataIndex].msgSentAt20Secs) {
				tableData[dataIndex].msgSentAt20Secs = true;
				const result = await sendDiscordMessage({
					channelId: configState.channelId,
					lastKillTime: moment(lastKillTime).format(
						"YYYY-MM-DD HH:mm:ss"
					),
					spawnTime: moment(lastKillTime)
						.add(NEXT_SPAWN_TIME_OFFSET, "seconds")
						.format("YYYY-MM-DD HH:mm:ss"),
					serverName: tableData[dataIndex].serverName,
					message: `世界BOSS將於20秒後在${tableData[dataIndex].serverName}出現`,
				});
				if (!result) {
					tableData[dataIndex].msgSentAt20Secs = false;
				}
			}
			if (isLoading) setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		const data = storage.get(TAG);
		if (!data || data.length == 0) {
			const tmp_data_table = initTableData();
			setTableData(tmp_data_table);
		} else {
			setTableData(
				data.map((td) => ({
					...td,
					killTime: td.killTime && moment(td.killTime),
					lastKillTime: td.lastKillTime && moment(td.lastKillTime),
				}))
			);
		}
	};

	useEffect(() => {
		storage.set(TAG, tableData);
	}, [tableData]);

	const defaultTableColumns = [
		{
			title: "重覆提醒",
			dataIndex: "requiredTwiceRemind",
			key: "requiredTwiceRemind",
			render: (text, e, index) => {
				const { serverId, serverName, Require2MinsMsg } = e;
				return (
					<>
						<input
							type="checkbox"
							checked={Require2MinsMsg}
							onChange={(e) => {
								const checked = e.target.checked;
								const tmp_data = [...tableData];
								const dataItem = tmp_data.find(
									(d) => d.serverId === serverId
								);
								dataItem.Require2MinsMsg = checked;

								setTableData(tmp_data);
							}}
						></input>
					</>
				);
			},
			selectionColumnWidth: 1,
		},
		{
			title: "伺服器",
			dataIndex: "serverId",

			key: "serverId",
			render: (text, e, index) => {
				const { serverName } = e;
				return <>{serverName}</>;
			},
			selectionColumnWidth: 4,
			sorter: (a, b) => a.serverId - b.serverId,
		},
		{
			title: "上次擊殺時間",
			dataIndex: "lastKillTime",
			selectionColumnWidth: 4,
			key: "lastKillTime",
			sorter: (a, b, order) => {
				if (!a.lastKillTime) {
					if (order == "descend") {
						return -1;
					} else {
						return 1;
					}
				} else if (!b.lastKillTime) {
					if (order == "descend") {
						return 1;
					} else {
						return -1;
					}
				}
				return a.lastKillTime.unix() > b.lastKillTime.unix() ? 1 : -1;
			},
			render: (text, e, index) => {
				const {
					lastKillTime,
					isRunning,
					isUpdateMode,
					killTime,
					serverId,
				} = e;

				const nextSpawnTimeLeft = timeLeftMap[serverId];
				return (
					<>
						{isRunning && !isUpdateMode ? (
							<span style={{ marginRight: "5px" }}>
								{moment(lastKillTime).format("HH:mm:ss")}
							</span>
						) : (
							<TimePicker
								format={"HH:mm:ss"}
								key={`timepicker-${e.serverId}`}
								style={{ marginRight: "5px" }}
								disabled={isRunning && !isUpdateMode}
								defaultValue={
									isRunning && !isUpdateMode
										? lastKillTime && moment(lastKillTime)
										: killTime && moment(killTime)
								}
								onChange={(time) => {
									if (!time) return;
									const tmp_data = [...tableData];
									const dataItem = tmp_data.find(
										(d) => d.serverId === serverId
									);
									// if (
									// 	time.unix() * 1000 - moment().unix() >
									// 	60 * 60 * 24
									// ) {
									// 	dataItem.killTime = moment(
									// 		time.unix() * 1000
									// 	).add(-1, "day");
									// } else {
									// 	dataItem.killTime = moment(
									// 		time.unix() * 1000
									// 	);
									// }

									dataItem.killTime = moment(
										time.unix() * 1000
									);

									setTableData(tmp_data);
								}}
							/>
						)}
						{nextSpawnTimeLeft > 0 &&
							isRunning &&
							(isUpdateMode ? (
								<>
									<Button
										icon={<CheckOutlined />}
										onClick={() => {
											const tmp_data = [...tableData];
											const dataItem = tmp_data.find(
												(d) => d.serverId === serverId
											);
											dataItem.isUpdateMode = false;
											dataItem.lastKillTime =
												moment(killTime);
											setTableData(tmp_data);
										}}
									></Button>
									<Button
										icon={<CloseOutlined />}
										onClick={() => {
											const tmp_data = [...tableData];
											const dataItem = tmp_data.find(
												(d) => d.serverId === serverId
											);
											dataItem.isUpdateMode = false;
											setTableData(tmp_data);
										}}
									></Button>
								</>
							) : (
								<Button
									icon={<FormOutlined />}
									onClick={() => {
										const tmp_data = [...tableData];
										const dataItem = tmp_data.find(
											(d) => d.serverId === serverId
										);
										dataItem.isUpdateMode = true;
										setTableData(tmp_data);
									}}
								></Button>
							))}
					</>
				);
			},
		},
		{
			sorter: (a, b, order) => {
				if (!timeLeftMap[a.serverId]) {
					return order === "descend" ? -1 : 1;
				} else if (!timeLeftMap[b.serverId]) {
					return order === "descend" ? 1 : -1;
				}
				return timeLeftMap[a.serverId] > timeLeftMap[b.serverId]
					? 1
					: -1;
			},
			title: "距離下次重生時間",
			dataIndex: "nextRepawnTime",
			selectionColumnWidth: 4,
			key: "nextRepawnTime",
			render: (text, e, index) => {
				const { isRunning, serverId } = e;

				if (!isRunning) return <></>;

				const nextSpawnTimeLeft = timeLeftMap[serverId];
				if (nextSpawnTimeLeft === 0) {
					return <span style={{ color: "red" }}>已經重生</span>;
				}

				const HMS = convertToHMS(Math.abs(nextSpawnTimeLeft));

				if (!HMS) return <></>;

				const [hours, minutes, seconds] = HMS;

				let color = undefined;
				if (minutes < 5) {
					color = "red";
				} else if (minutes < 10) {
					color = "orange";
				} else {
					color = "green";
				}

				return (
					<span style={{ color }}>
						{hours.toString().padStart(2, 0)}:
						{minutes.toString().padStart(2, 0)}:
						{seconds.toString().padStart(2, 0)}
					</span>
				);
			},
		},
		{
			title: (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<div style={{ alignSelf: "center" }}>動作</div>
					<Button
						icon={<SettingOutlined />}
						onClick={() => showConfigModal()}
					></Button>
				</div>
			),
			dataIndex: "action",
			fixed: "right",
			selectionColumnWidth: 2,
			key: "action",
			render: (text, e, index) => {
				const { isRunning, killTime, serverId } = e;
				return (
					<>
						{!isRunning ? (
							<Button
								onClick={() => {
									const tmp_data = [...tableData];
									const dataItem = tmp_data.find(
										(d) => d.serverId === serverId
									);

									if (killTime) {
										if (
											killTime.isBefore(
												moment().add(
													NEXT_SPAWN_TIME_OFFSET * -1,
													"seconds"
												)
											)
										) {
											dataItem.lastKillTime = undefined;
											dataItem.killTime = undefined;
											dataItem.isUpdateMode = false;
											dataItem.isSent = false;
											setTableData(tmp_data);
											return;
										}
										dataItem.lastKillTime =
											moment(killTime);
									} else {
										const now = moment();
										dataItem.killTime = now;
										dataItem.lastKillTime = now;
									}

									dataItem.isRunning = !isRunning;
									setTableData(tmp_data);
								}}
							>
								開始
							</Button>
						) : (
							<Button
								onClick={() => {
									const tmp_data = [...tableData];
									const dataItem = tmp_data.find(
										(d) => d.serverId === serverId
									);

                                    const now = moment();
                                    dataItem.killTime = now;
                                    dataItem.lastKillTime = now;
									dataItem.isUpdateMode = false;
									dataItem.isSent = false;

									dataItem.isRunning = true;
									setTableData(tmp_data);
								}}
							>
								重設
							</Button>
						)}
					</>
				);
			},
		},
	];

	return (
		<>
			<Table
				size={"small"}
				dataSource={tableData}
				columns={defaultTableColumns}
				sortDirections={["descend", "ascend"]}
				pagination={{
					pageSize: "100",
				}}
				loading={isLoading}
			/>
			<ConfigModal open={isConfigModalOpen} onClose={closeConfigModal} />
		</>
	);
};

export default BossCountDown;
