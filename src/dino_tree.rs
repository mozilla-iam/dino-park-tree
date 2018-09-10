use std::collections::HashMap;
use std::num::NonZeroUsize;
use std::time::Instant;

use rocket_contrib::Value;

use dino::Dino;

#[derive(Clone)]
pub struct Node {
    pub parent: Option<NonZeroUsize>,
    pub first_child: Option<NonZeroUsize>,
    pub num_children: usize,
    pub dino: Dino,
}

#[derive(Default)]
pub struct DinoTree {
    pub t: Vec<Node>,
    pub user_id_to_index: HashMap<String, usize>,
    pub full: Value,
}

fn roots<'a>(dinos: impl Iterator<Item = &'a Dino> + Clone) -> impl Iterator<Item = &'a Dino> {
    let ids = dinos.clone().map(|d| d.employee_id).collect::<Vec<u64>>();
    dinos.filter(move |d| d.manager_id.is_none() || !ids.contains(&d.manager_id.unwrap()))
}

fn directs<'a>(
    dinos: impl Iterator<Item = &'a Dino>,
    manager_id: u64,
) -> impl Iterator<Item = &'a Dino> {
    dinos.filter(move |d| d.manager_id.map(|id| id == manager_id).unwrap_or_default())
}

impl DinoTree {
    pub fn from<'a>(dinos: impl Iterator<Item = &'a Dino> + Clone) -> Option<DinoTree> {
        let mut t = vec![];
        let mut user_id_to_index = HashMap::new();
        for (index, dino) in roots(dinos.clone()).enumerate() {
            user_id_to_index.insert(dino.user_id.clone(), index);
            t.push(Node {
                parent: None,
                first_child: None,
                num_children: 0,
                dino: dino.clone(),
            });
        }

        let mut dino_tree = DinoTree {
            t,
            user_id_to_index,
            full: Value::default(),
        };
        dino_tree.populate(dinos, 0);
        dino_tree.full_org();
        Some(dino_tree)
    }

    pub fn get_manager(&self, user_id: &str) -> Option<Value> {
        let index = self.user_id_to_index.get(user_id)?;
        let parent = (*self.t.get(*index).map(|n| &n.parent)?)?;
        self.t.get(parent.get()).map(|n| n.dino.data.clone())
    }

    pub fn get_directs(&self, user_id: &str) -> Option<Vec<Value>> {
        let index = self.user_id_to_index.get(user_id)?;
        let first_child = (*self.t.get(*index).map(|n| &n.first_child)?)?;
        let num_children = *self.t.get(*index).map(|n| &n.num_children)?;
        Some(
            self.t
                .iter()
                .skip(first_child.get())
                .take(num_children)
                .map(|n| n.dino.data.clone())
                .collect(),
        )
    }

    pub fn update(&mut self, dino: &Dino) -> Result<(), String> {
        if self.t.iter().any(|n| n.dino.user_id == dino.user_id) {
            self.update_dino(&dino)
        } else {
            Err(format!("failed to update {:?}", dino))
        }
    }

    fn update_dino(&mut self, dino: &Dino) -> Result<(), String> {
        if let Some(DinoTree {
            t,
            user_id_to_index,
            full,
        }) = DinoTree::from(self.t.iter().map(|n| {
            if n.dino.user_id == dino.user_id {
                &dino
            } else {
                &n.dino
            }
        })) {
            self.t = t;
            self.user_id_to_index = user_id_to_index;
            self.full = full;
            Ok(())
        } else {
            Err(format!("Failed updating user"))
        }
    }

    pub fn full_org(&mut self) -> &Self {
        let now = Instant::now();
        let mut org = vec![];
        for node in self.t.iter().take_while(|n| n.parent.is_none()) {
            let t = self.catch(node);
            org.push(t);
        }
        let d = now.elapsed();
        println!("{}.{:6} s", d.as_secs(), d.subsec_micros());
        self.full = json!(org);
        self
    }

    fn catch(&self, node: &Node) -> Value {
        let children = node.first_child.map(|first_child| {
            self.t
                .iter()
                .skip(first_child.get())
                .take(node.num_children)
                .map(|n| self.catch(n))
                .collect::<Vec<Value>>()
        });
        json!({
            "data": node.dino.data.clone(),
            "children": children
        })
    }

    fn update_node(
        &mut self,
        index: usize,
        first_child: Option<NonZeroUsize>,
        num_children: usize,
    ) -> Option<()> {
        let d = self.t.get_mut(index)?;
        d.first_child = first_child;
        d.num_children = num_children;
        Some(())
    }

    fn sort_children(&mut self, from: usize, len: usize) {
        self.t[from..from + len].sort_by(|a, b| a.num_children.cmp(&b.num_children))
    }

    fn populate<'a>(
        &mut self,
        dinos: impl Iterator<Item = &'a Dino> + Clone,
        index: usize,
    ) -> Option<()> {
        println!("pop {}", index);
        if index >= self.t.len() {
            return Some(());
        }
        let directs: Vec<Dino> = directs(dinos.clone(), self.t.get(index)?.dino.employee_id)
            .cloned()
            .collect();
        let first_child = self.t.len();
        let mut num_children = 0;
        for child in directs {
            self.user_id_to_index
                .insert(child.user_id.clone(), self.t.len());
            self.t.push(Node {
                parent: NonZeroUsize::new(index),
                first_child: None,
                num_children: 0,
                dino: child,
            });
            num_children += 1;
        }
        self.sort_children(first_child, num_children);
        self.update_node(index, NonZeroUsize::new(first_child), num_children);
        self.populate(dinos, index + 1)
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_update() {
        let d = Dino {
            user_id: "1".to_owned(),
            employee_id: 1,
            manager_id: None,
            data: Value::default(),
        };
        let dinos = vec![d];
        let t = DinoTree::from(dinos.iter());
        assert!(t.is_some());
        let mut t = t.unwrap();
        assert_eq!(t.t.len(), 1);
        let d_update = Dino {
            user_id: "1".to_owned(),
            employee_id: 1,
            manager_id: None,
            data: json!("foo"),
        };
        assert!(t.update(&d_update).is_ok());
        assert_eq!(t.t.len(), 1);
        assert_eq!(t.t[0].dino.data, json!("foo"));
    }
}
