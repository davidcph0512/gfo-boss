import React, { useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { RouterProvider, useNavigate } from "react-router-dom";
import router from "./router";
import { Button, Layout, Menu, theme } from "antd";
import menuList from "./menu";
const { Header, Sider, Content } = Layout;
const App = () => {
	const [collapsed, setCollapsed] = useState(false);
	const {
		token: { colorBgContainer, borderRadiusLG },
	} = theme.useToken();

	const [headerTitle, setHeaderTitle] = useState("");

	return (
		<Layout style={{ height: "100vh" }}>
			{/* <Sider trigger={null} collapsible collapsed={collapsed}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '10%'
                }} ><img src='https://www.x-legend.com/online/grandfantasia-origin/assets/images/register/logo.webp' width={'100%'}/></div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['1']}
                    
                    items={menuList.map((menuItem, index) => ({ ...menuItem, key: index }))}
                    onClick={(e) => {
                        const { key } = e;
                        router.navigate(menuList[key].path);
                        setHeaderTitle(menuList[key].label)
                    }}
                />
            </Sider> */}
			<Layout>
				{/* <Header
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    {headerTitle}
                </Header> */}
				<div
					style={{
						overflow: "auto",
						scrollbarWidth: "thin",
						width: "100vw",
						display: "flex",
						justifyContent: "center",
					}}
				>
					<Content
						style={{
							margin: "24px 16px",
							padding: "0 48px",
							maxWidth: "1200px",
							background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            minHeight: 'fit-content'
						}}
					>
						<RouterProvider router={router} />
					</Content>
				</div>
			</Layout>
		</Layout>
	);
};
export default App;
