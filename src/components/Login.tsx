import { Button, Card, Col, Form, Input, message, Row } from 'antd';
import log from 'loglevel';
import * as React from 'react';
import { useState } from 'react';

import { getUser, login, User } from '../auth';

export const Login: React.FC<{ onLogin?: (user: User) => void }> = ({ onLogin }) => {
    const [isBusy, setIsBusy] = useState(false);
    const [form] = Form.useForm();
    async function onFinish(values: Record<string, string>) {
        try {
            const { username, password } = values;
            setIsBusy(true);
            await login(username, password);
            onLogin && onLogin(await getUser());
        } catch (error) {
            message.warn('Login failed, username or password incorrect');
            log.error({
                message: 'User login failed',
                error: error + '',
            });
        } finally {
            setIsBusy(false);
        }
    }

    return (
        <Row justify='space-around' align='middle' style={{ height: '100%' }}>
            <Col span={12}>
                <Card>
                    <Form form={form} onFinish={onFinish}>
                        <Form.Item
                            name='username'
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your username.',
                                },
                                {
                                    pattern: /^.*@.*$/,
                                    message: 'Your username should be your name, not email address.',
                                },
                            ]}
                        >
                            <Input data-test-id='username' placeholder='Username' />
                        </Form.Item>

                        <Form.Item
                            name='password'
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your password.',
                                },
                            ]}
                        >
                            <Input.Password data-test-id='password' placeholder='Password' />
                        </Form.Item>

                        <Button
                            loading={isBusy}
                            disabled={isBusy}
                            type='primary'
                            className='form-submit'
                            data-test-id='credentials-submit'
                            htmlType='submit'
                        >
                            Login
                        </Button>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};
