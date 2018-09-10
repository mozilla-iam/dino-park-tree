use serde_json::Value;

#[derive(Clone, Debug)]
pub struct Dino {
    pub user_id: String,
    pub employee_id: u64,
    pub manager_id: Option<u64>,
    pub data: Value,
}

impl Dino {
    pub fn from(v: &Value) -> Option<Self> {
        match (get_user_id(&v), get_manager_id(&v), get_employee_id(&v)) {
            (Some(user_id), manager_id, Some(employee_id)) => Some(Dino {
                user_id,
                employee_id,
                manager_id,
                data: slim_down_profile(&v),
            }),
            _ => None,
        }
    }
}

fn slim_down_profile(v: &Value) -> Value {
    let first_name = v
        .as_object()
        .and_then(|o| o.get("first_name"))
        .and_then(|o| o.get("value"))
        .cloned()
        .unwrap_or_default();
    let last_name = v
        .as_object()
        .and_then(|o| o.get("last_name"))
        .and_then(|o| o.get("value"))
        .cloned()
        .unwrap_or_default();
    let picture = v
        .as_object()
        .and_then(|o| o.get("picture"))
        .and_then(|o| o.get("value"))
        .cloned()
        .unwrap_or_default();
    let fun_title = v
        .as_object()
        .and_then(|o| o.get("fun_title"))
        .and_then(|o| o.get("value"))
        .cloned()
        .unwrap_or_default();
    let title = v
        .as_object()
        .and_then(|o| o.get("access_information"))
        .and_then(|o| o.get("hris"))
        .and_then(|o| o.get("values"))
        .and_then(|o| o.get("businessTitle"))
        .and_then(|o| o.as_str())
        .map(String::from)
        .unwrap_or_default();
    json!({
        "first_name": first_name,
        "last_name": last_name,
        "picture": picture,
        "title": title,
        "fun_title": fun_title,
    })
}

fn get_manager_id(v: &Value) -> Option<u64> {
    v.as_object()
        .and_then(|o| o.get("access_information"))
        .and_then(|o| o.get("hris"))
        .and_then(|o| o.get("values"))
        .and_then(|o| o.get("WorkersManagersEmployeeID"))
        .and_then(|o| o.as_u64())
}

fn get_employee_id(v: &Value) -> Option<u64> {
    v.as_object()
        .and_then(|o| o.get("access_information"))
        .and_then(|o| o.get("hris"))
        .and_then(|o| o.get("values"))
        .and_then(|o| o.get("EmployeeID"))
        .and_then(|o| o.as_u64())
}

fn get_user_id(v: &Value) -> Option<String> {
    v.as_object()
        .and_then(|o| o.get("user_id"))
        .and_then(|o| o.get("value"))
        .and_then(|o| o.as_str())
        .map(|o| o.to_owned())
}

#[cfg(test)]
mod test {
    use super::*;
    use serde_json;

    const PROFILE_JSON_SLIM: &'static str = r#"
{
    "schema": "https://person-api.sso.mozilla.com/schema/v2/profile",
    "user_id": {
        "value": "email|cwjVGDBxbgoyZSVcCUsMXavl"
    },
    "first_name": {
        "value": "Matthew"
    },
    "last_name": {
        "value": "Miller"
    },
    "primary_email": {
        "value": "davisamanda@yahoo.com"
    },
    "access_information": {
        "hris": {
            "values": {
                "EmployeeID": 3932,
                "businessTitle": "Bookseller",
                "WorkersManagersEmployeeID": 4706
            }
        }
    },
    "fun_title": {
        "value": "Size most with this song free."
    },
    "picture": {
        "value": "https://placeholdit.imgix.net/~text?txtsize=55&txt=349x521&w=349&h=521"
    }
}"#;

    #[test]
    fn test_from() {
        let v = serde_json::from_str(PROFILE_JSON_SLIM).unwrap();
        let d = Dino::from(&v);
        assert!(d.is_some());
        let d = d.unwrap();
        assert_eq!(d.user_id, "email|cwjVGDBxbgoyZSVcCUsMXavl");
        assert_eq!(d.employee_id, 3932u64);
        assert_eq!(d.manager_id, Some(4706u64));
    }
}
