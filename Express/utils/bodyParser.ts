import { User } from '../../src/model/dto/UserDTO';

function parseUserBody(body: string) {
  const attributeChecker: User = {
    userId: '',
    password: '',
    email: '',
    username: '',
  };

  // userId=hoeeeeeh&email=hoeeeeeh@naver.com&password=12341234&username=hoeh
  const attributeList = body.split('&');
  const parsedBody = attributeList.reduce<User>((acc, attribute) => {
    const [key, value] = attribute.split('=');

    if (key in attributeChecker) {
      acc[key as keyof User] = value;
    }
    return acc;
  }, attributeChecker);

  return parsedBody;

  // const isAllAttrFilled = Object.values(parsedBody).every((value: string) => value !== '');
  // if (isAllAttrFilled) return parsedBody;
  // throw new Error('UserDTO 의 항목 중, 비어있는 항목이 있습니다.');
}

export { parseUserBody };
