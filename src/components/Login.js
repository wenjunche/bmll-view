import { Button, Card, Col, Form, Input, message, Row } from 'antd';
import log from 'loglevel';
import * as React from 'react';
import { useState } from 'react';
import { getUser, login } from '../auth';
export const Login = ({ onLogin }) => {
    const [isBusy, setIsBusy] = useState(false);
    const [form] = Form.useForm();
    async function onFinish(values) {
        try {
            const { username, password } = values;
            setIsBusy(true);
            await login(username, password);
            onLogin && onLogin(await getUser());
        }
        catch (error) {
            message.warn('Login failed, username or password incorrect');
            log.error({
                message: 'User login failed',
                error: error + '',
            });
        }
        finally {
            setIsBusy(false);
        }
    }
    return (React.createElement(Row, { justify: 'space-around', align: 'middle', style: { height: '100%' } },
        React.createElement(Col, { span: 12 },
            React.createElement(Card, null,
                React.createElement(Form, { form: form, onFinish: onFinish },
                    React.createElement(Form.Item, { name: 'username', rules: [
                            {
                                required: true,
                                message: 'Please input your username.',
                            },
                            {
                                pattern: /^.*@.*$/,
                                message: 'Your username should be your name, not email address.',
                            },
                        ] },
                        React.createElement(Input, { "data-test-id": 'username', placeholder: 'Username' })),
                    React.createElement(Form.Item, { name: 'password', rules: [
                            {
                                required: true,
                                message: 'Please input your password.',
                            },
                        ] },
                        React.createElement(Input.Password, { "data-test-id": 'password', placeholder: 'Password' })),
                    React.createElement(Button, { loading: isBusy, disabled: isBusy, type: 'primary', className: 'form-submit', "data-test-id": 'credentials-submit', htmlType: 'submit' }, "Login"))))));
};
//# sourceMappingURL=Login.js.map